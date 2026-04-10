const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['sms', 'email', 'push'],
    required: true
  },
  recipient: {
    type: String,
    required: true
  },
  subject: {
    type: String
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed', 'bounced'],
    default: 'pending'
  },
  messageId: {
    type: String
  },
  error: {
    type: String
  },
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  relatedEntity: {
    entityType: {
      type: String,
      enum: ['property', 'tenant', 'payment', 'maintenance', 'lease']
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId
    }
  },
  metadata: {
    priority: {
      type: String,
      enum: ['low', 'normal', 'high'],
      default: 'normal'
    },
    scheduledFor: {
      type: Date
    },
    sentAt: {
      type: Date
    },
    deliveredAt: {
      type: Date
    },
    cost: {
      type: Number
    },
    retryCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
notificationSchema.index({ type: 1, status: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ recipient: 1 });
notificationSchema.index({ 'relatedEntity.entityType': 1, 'relatedEntity.entityId': 1 });
notificationSchema.index({ 'metadata.scheduledFor': 1 });

// Static methods
notificationSchema.statics.findByType = function(type) {
  return this.find({ type }).sort({ createdAt: -1 });
};

notificationSchema.statics.findByStatus = function(status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

notificationSchema.statics.findPendingNotifications = function() {
  return this.find({ 
    status: 'pending',
    'metadata.scheduledFor': { $lte: new Date() }
  }).sort({ 'metadata.priority': -1, createdAt: 1 });
};

notificationSchema.statics.getFailedNotifications = function(hours = 24) {
  const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
  return this.find({ 
    status: 'failed',
    createdAt: { $gte: cutoffDate }
  }).sort({ createdAt: -1 });
};

notificationSchema.statics.getNotificationStats = function(startDate, endDate) {
  const matchStage = {};
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          type: '$type',
          status: '$status'
        },
        count: { $sum: 1 },
        totalCost: { $sum: '$metadata.cost' }
      }
    },
    {
      $group: {
        _id: '$_id.type',
        stats: {
          $push: {
            status: '$_id.status',
            count: '$count'
          }
        },
        totalCount: { $sum: '$count' },
        totalCost: { $sum: '$totalCost' }
      }
    }
  ]);
};

// Instance methods
notificationSchema.methods.markAsSent = function(messageId, cost = null) {
  this.status = 'sent';
  this.messageId = messageId;
  this.metadata.sentAt = new Date();
  if (cost) this.metadata.cost = cost;
  return this.save();
};

notificationSchema.methods.markAsDelivered = function() {
  this.status = 'delivered';
  this.metadata.deliveredAt = new Date();
  return this.save();
};

notificationSchema.methods.markAsFailed = function(error) {
  this.status = 'failed';
  this.error = error;
  this.metadata.retryCount += 1;
  return this.save();
};

notificationSchema.methods.canRetry = function(maxRetries = 3) {
  return this.status === 'failed' && this.metadata.retryCount < maxRetries;
};

// Pre-save middleware
notificationSchema.pre('save', function(next) {
  if (this.isNew && this.status === 'sent' && !this.metadata.sentAt) {
    this.metadata.sentAt = new Date();
  }
  next();
});

// Virtual for formatted recipient
notificationSchema.virtual('formattedRecipient').get(function() {
  if (this.type === 'email') {
    return this.recipient.includes('@') ? this.recipient : 'Invalid email';
  } else if (this.type === 'sms') {
    return this.recipient.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  }
  return this.recipient;
});

// Virtual for duration
notificationSchema.virtual('deliveryDuration').get(function() {
  if (this.metadata.sentAt && this.metadata.deliveredAt) {
    return this.metadata.deliveredAt - this.metadata.sentAt;
  }
  return null;
});

module.exports = mongoose.model('Notification', notificationSchema);
