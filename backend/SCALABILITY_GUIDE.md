# Nyumba360 Scalability & Production Guide

## Overview

This guide covers the production-ready scalability features implemented to ensure the Nyumba360 notification system can handle high traffic loads without crashing.

## Architecture Overview

### Multi-Layer Scalability
```
Load Balancer (Nginx) 
    |
    v
App Cluster (3+ instances)
    |
    v
Queue System (Redis)
    |
    v
Database Cluster (MongoDB)
```

## Production Features Implemented

### 1. **Horizontal Scaling**
- **Cluster Mode**: Automatic multi-core utilization
- **Load Balancing**: Nginx with health checks
- **Container Orchestration**: Docker Swarm/Kubernetes ready
- **Auto-scaling**: PM2 cluster mode with dynamic worker management

### 2. **Rate Limiting & Protection**
- **Multi-tier Rate Limiting**:
  - General API: 1000 requests/15min per IP
  - Notifications: 100 requests/1min per user
  - SMS: 20 requests/1min per user
  - Email: 50 requests/1min per user
  - Bulk Operations: 10 requests/5min per user
  - Emergency Alerts: 5 requests/1min (admin bypass)

### 3. **Circuit Breakers**
- **SMS Service Circuit**: Auto-failover after 3 failures
- **Email Service Circuit**: Auto-failover after 5 failures
- **Database Circuit**: Auto-failover after 10 failures
- **External API Circuit**: Auto-failover after 3 failures
- **Automatic Recovery**: Exponential backoff with health checks

### 4. **Queue Management**
- **Priority Queues**: 4 priority levels (urgent, normal, low, bulk)
- **Distributed Processing**: Redis-backed queue system
- **Retry Logic**: Exponential backoff with max 3 retries
- **Dead Letter Queue**: Failed jobs isolation
- **Memory Fallback**: In-memory queues if Redis unavailable

### 5. **Health Monitoring**
- **System Metrics**: CPU, Memory, Disk, Network
- **Application Metrics**: Response time, Error rate, Active connections
- **Dependency Health**: Database, Redis, SMS, Email services
- **Alerting**: Automatic alerts on threshold breaches
- **Kubernetes Ready**: Liveness, Readiness, Health endpoints

### 6. **Graceful Shutdown**
- **Connection Draining**: Wait for active requests to complete
- **Queue Processing**: Complete pending jobs before shutdown
- **Database Cleanup**: Proper connection closure
- **Zero Downtime**: Rolling restarts with load balancer

## Capacity Planning

### Expected Load Handling
| Metric | Current Capacity | Scaling Target |
|--------|------------------|---------------|
| Concurrent Users | 10,000 | 100,000+ |
| Requests/Second | 1,000 | 10,000+ |
| SMS/Minute | 500 | 5,000+ |
| Emails/Minute | 1,000 | 10,000+ |
| Database Connections | 100 | 1,000+ |

### Resource Requirements

#### Minimum Production Setup
- **CPU**: 4 cores (2.0GHz+)
- **Memory**: 8GB RAM
- **Storage**: 100GB SSD
- **Network**: 1Gbps

#### Recommended Production Setup
- **CPU**: 8+ cores (3.0GHz+)
- **Memory**: 16GB+ RAM
- **Storage**: 500GB+ SSD
- **Network**: 10Gbps

## Deployment Options

### Option 1: PM2 Cluster (Simple)
```bash
# Install PM2
npm install -g pm2

# Start in cluster mode
pm2 start ecosystem.config.js --env production

# Monitor
pm2 monit

# Scale up/down
pm2 scale nyumba360-api +2
```

### Option 2: Docker Swarm (Medium)
```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker-compose -f docker-compose.prod.yml up -d

# Scale services
docker service scale nyumba360_app=5
```

### Option 3: Kubernetes (Advanced)
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nyumba360-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nyumba360-api
  template:
    metadata:
      labels:
        app: nyumba360-api
    spec:
      containers:
      - name: app
        image: nyumba360/api:latest
        ports:
        - containerPort: 5001
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /live
            port: 5001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 5001
          initialDelaySeconds: 5
          periodSeconds: 5
```

## Monitoring & Alerting

### Health Endpoints
- `/health` - Basic health check
- `/health/detailed` - Detailed system status
- `/ready` - Readiness probe (Kubernetes)
- `/live` - Liveness probe (Kubernetes)
- `/api/system/status` - Full system metrics

### Metrics Collection
```bash
# System metrics
curl http://localhost:5001/api/system/status

# Health check
curl http://localhost:5001/health/detailed

# Queue status
curl http://localhost:5001/api/system/status | jq '.queues'
```

### Alert Thresholds
- **CPU Usage**: >80% (Warning), >95% (Critical)
- **Memory Usage**: >85% (Warning), >95% (Critical)
- **Response Time**: >5s (Warning), >10s (Critical)
- **Error Rate**: >10% (Warning), >50% (Critical)
- **Queue Size**: >1000 (Warning), >5000 (Critical)

## Performance Optimization

### Database Optimization
```javascript
// Connection pooling
mongoose.connect(uri, {
  maxPoolSize: 50,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferMaxEntries: 0,
  bufferCommands: false
});

// Indexing for notifications
NotificationSchema.index({ type: 1, status: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, createdAt: -1 });
```

### Caching Strategy
```javascript
// Redis caching
const cacheResults = async (key, data, ttl = 300) => {
  await redis.setex(key, ttl, JSON.stringify(data));
};

// Cache notification templates
const cachedTemplate = await redis.get('template:rent_reminder');
if (!cachedTemplate) {
  const template = await generateTemplate();
  await cacheResults('template:rent_reminder', template);
}
```

### Queue Optimization
```javascript
// Batch processing
const processBatch = async (jobs) => {
  const batchSize = 100;
  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = jobs.slice(i, i + batchSize);
    await Promise.all(batch.map(processJob));
  }
};
```

## Disaster Recovery

### Backup Strategy
- **Database**: Daily automated backups with 30-day retention
- **Redis**: AOF persistence with hourly snapshots
- **Logs**: Centralized logging with ELK stack
- **Configuration**: Git-tracked with environment-specific configs

### Failover Process
1. **Health Detection**: Automatic monitoring detects failures
2. **Circuit Breaker**: Failed services automatically isolated
3. **Load Balancer**: Traffic rerouted to healthy instances
4. **Auto-recovery**: Failed services automatically restarted
5. **Manual Intervention**: Alerts sent for critical failures

### Recovery Time Objectives (RTO)
- **Service Restart**: <2 minutes
- **Database Failover**: <5 minutes
- **Queue Recovery**: <1 minute
- **Full System Recovery**: <10 minutes

## Security Considerations

### Rate Limiting Bypass
- **Admin Users**: Emergency alerts bypass rate limits
- **Internal Services**: Health checks exempt from limits
- **Whitelist IPs**: Critical infrastructure bypass

### DDoS Protection
```nginx
# Nginx rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=sms:10m rate=1r/s;

server {
    limit_req zone=api burst=20 nodelay;
    limit_req zone=sms burst=5 nodelay;
}
```

### Input Validation
- **Request Size**: Limited to 10MB
- **Phone Numbers**: Regex validation
- **Email Addresses**: RFC-compliant validation
- **Content Filtering**: Spam and profanity detection

## Testing Scalability

### Load Testing
```bash
# Install artillery
npm install -g artillery

# Run load test
artillery run load-test.yml

# Sample test config
# load-test.yml
config:
  target: 'http://localhost:5001'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 50
    - duration: 60
      arrivalRate: 100

scenarios:
  - name: "Send SMS"
    weight: 70
    flow:
      - post:
          url: "/api/notifications/sms"
          json:
            phoneNumber: "+254712345678"
            message: "Test message"
```

### Stress Testing
```bash
# Apache Bench
ab -n 1000 -c 100 http://localhost:5001/health

# Siege
siege -c 200 -t 60S http://localhost:5001/api/notifications/sms
```

## Cost Optimization

### Resource Efficiency
- **Auto-scaling**: Scale based on actual load
- **Spot Instances**: Use spot instances for non-critical workloads
- **Resource Limits**: Set appropriate CPU/memory limits
- **Queue Batching**: Process jobs in batches to reduce overhead

### Monitoring Costs
- **Log Retention**: Rotate logs regularly
- **Metrics Storage**: Compress historical data
- **Alert Frequency**: Avoid alert fatigue
- **Dashboard Optimization**: Efficient query design

## Troubleshooting

### Common Issues

#### High Memory Usage
```bash
# Check memory usage
pm2 monit

# Restart specific instances
pm2 restart nyumba360-api

# Scale down if necessary
pm2 scale nyumba360-api 2
```

#### Database Connection Issues
```bash
# Check connection pool
curl http://localhost:5001/api/system/status | jq '.dependencies.database'

# Restart database connections
pm2 restart nyumba360-api
```

#### Queue Backlog
```bash
# Check queue status
curl http://localhost:5001/api/system/status | jq '.queues'

# Clear stuck jobs
redis-cli FLUSHDB
```

#### Circuit Breaker Tripped
```bash
# Check circuit breaker status
curl http://localhost:5001/api/system/status | jq '.circuitBreakers'

# Reset circuit breakers (admin only)
curl -X POST http://localhost:5001/api/admin/reset-circuit-breakers \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## Best Practices

### Development
1. **Environment Parity**: Match production environment in development
2. **Load Testing**: Regular performance testing
3. **Monitoring**: Comprehensive logging and metrics
4. **Documentation**: Keep scalability docs updated

### Operations
1. **Regular Backups**: Automated backup verification
2. **Security Updates**: Regular dependency updates
3. **Capacity Planning**: Monitor growth trends
4. **Incident Response**: Document and practice response procedures

### Performance
1. **Lazy Loading**: Load resources only when needed
2. **Batching**: Group operations where possible
3. **Caching**: Cache frequently accessed data
4. **Connection Pooling**: Reuse database connections

## Future Enhancements

### Planned Improvements
- **Microservices**: Split into specialized services
- **Event Sourcing**: Implement event-driven architecture
- **CDN Integration**: Static asset delivery optimization
- **Advanced Caching**: Multi-layer caching strategy
- **Auto-scaling**: Kubernetes HPA integration

### Scalability Targets
- **Users**: 1M+ concurrent users
- **Requests**: 100K+ requests/second
- **Notifications**: 1M+ notifications/hour
- **Uptime**: 99.99% availability
- **Response Time**: <200ms average

This production-ready architecture ensures the Nyumba360 notification system can handle enterprise-scale loads while maintaining reliability and performance.
