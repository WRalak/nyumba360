# Nyumba360 Product 5 Deployment Checklist

## **STEP 1: Deploy to Staging Environment**

### **Database Setup**
```bash
# Create staging database
mongosh nyumba360_staging --eval "
db.createCollection('expenses');
db.createCollection('maintenance_tickets');
db.createCollection('vacancy_listings');
db.createCollection('agents');
db.createCollection('agent_managements');
"

# Create indexes for performance
mongosh nyumba360_staging --eval "
db.expenses.createIndex({ property_id: 1, expense_date: -1 });
db.expenses.createIndex({ landlord_id: 1, expense_date: -1 });
db.maintenance_tickets.createIndex({ property_id: 1, status: 1 });
db.vacancy_listings.createIndex({ is_active: 1, is_featured: 1 });
db.agents.createIndex({ license_number: 1 });
db.agent_managements.createIndex({ agent_id: 1, status: 1 });
"
```

### **Environment Configuration**
```bash
# Create staging environment file
cp .env.example .env.staging

# Update staging variables
echo "NODE_ENV=staging
PORT=5002
MONGODB_URI=mongodb://localhost:27017/nyumba360_staging
JWT_SECRET=staging_jwt_secret_key_here
MPESA_CONSUMER_KEY=staging_consumer_key
MPESA_CONSUMER_SECRET=staging_consumer_secret
MPESA_PASSKEY=staging_passkey
MPESA_SHORTCODE=174379
MPESA_CALLBACK_URL=https://staging.nyumba360.co.ke/api/payments/mpesa/callback" > .env.staging
```

### **Deploy Commands**
```bash
# Install dependencies
npm install

# Run database migrations (if using migration tool)
npm run migrate

# Start staging server
NODE_ENV=staging npm start
```

### **Staging Tests**
```bash
# Test new endpoints
curl -X GET http://localhost:5002/api/system/status

# Test expense creation
curl -X POST http://localhost:5002/api/expenses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <test_token>" \
  -d '{"property_id":"test_prop","expense_type":"repair","description":"Test","amount":1000,"payment_method":"mpesa"}'

# Test agent profile creation
curl -X POST http://localhost:5002/api/agents/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <test_token>" \
  -d '{"agency_name":"Test Agency","license_number":"TEST-123","license_expiry":"2025-12-31"}'
```

---

## **STEP 2: Update Frontend Integration**

### **React Component Updates Required**

#### **1. Expense Management Components**
```jsx
// src/components/expenses/ExpenseForm.jsx
import React, { useState } from 'react';
import axios from 'axios';

const ExpenseForm = ({ propertyId, onSuccess }) => {
  const [formData, setFormData] = useState({
    property_id: propertyId,
    expense_type: '',
    description: '',
    amount: '',
    payment_method: 'mpesa'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/expenses', formData);
      onSuccess();
    } catch (error) {
      console.error('Error creating expense:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields for expense creation */}
    </form>
  );
};

export default ExpenseForm;
```

#### **2. Enhanced Maintenance Components**
```jsx
// src/components/maintenance/MaintenanceTicket.jsx
const MaintenanceTicket = ({ ticket, onUpdate }) => {
  const updateStatus = async (newStatus) => {
    try {
      await axios.put(`/api/maintenance/${ticket._id}`, { status: newStatus });
      onUpdate();
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  return (
    <div className="maintenance-ticket">
      <h3>{ticket.title}</h3>
      <p>Status: {ticket.status}</p>
      <p>Priority: {ticket.priority}</p>
      <button onClick={() => updateStatus('in_progress')}>
        Start Work
      </button>
    </div>
  );
};
```

#### **3. Vacancy Listing Components**
```jsx
// src/components/vacancies/VacancyCard.jsx
const VacancyCard = ({ listing, onInquiry }) => {
  const handleInquiry = async () => {
    try {
      await axios.post(`/api/vacancies/${listing._id}/inquiries`, {
        name: 'Test User',
        phone: '0712345678',
        email: 'test@example.com',
        message: 'Interested in this property'
      });
      onInquiry();
    } catch (error) {
      console.error('Error submitting inquiry:', error);
    }
  };

  return (
    <div className="vacancy-card">
      <h3>{listing.title}</h3>
      <p>KES {listing.monthly_rent.toLocaleString()}/month</p>
      <button onClick={handleInquiry}>Make Inquiry</button>
    </div>
  );
};
```

#### **4. Agent Portal Components**
```jsx
// src/components/agents/AgentProfile.jsx
const AgentProfile = () => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    axios.get('/api/agents/profile').then(response => {
      setProfile(response.data.agent);
    });
  }, []);

  return (
    <div className="agent-profile">
      {profile && (
        <>
          <h2>{profile.agency_name}</h2>
          <p>License: {profile.license_number}</p>
          <p>Commission Rate: {profile.commission_rate}%</p>
        </>
      )}
    </div>
  );
};
```

### **API Service Updates**
```javascript
// src/services/api.js
export const expenseAPI = {
  getExpenses: (filters) => axios.get('/api/expenses', { params: filters }),
  createExpense: (data) => axios.post('/api/expenses', data),
  updateExpense: (id, data) => axios.put(`/api/expenses/${id}`, data),
  deleteExpense: (id) => axios.delete(`/api/expenses/${id}`),
  getExpenseSummary: (filters) => axios.get('/api/expenses/summary', { params: filters })
};

export const agentAPI = {
  getProfile: () => axios.get('/api/agents/profile'),
  createProfile: (data) => axios.post('/api/agents/profile', data),
  updateProfile: (data) => axios.put('/api/agents/profile', data),
  getStats: () => axios.get('/api/agents/stats'),
  searchAgents: (filters) => axios.get('/api/agents/search', { params: filters })
};
```

### **Route Updates**
```javascript
// src/App.jsx
import ExpenseDashboard from './pages/expenses/ExpenseDashboard';
import AgentPortal from './pages/agents/AgentPortal';
import RentalHistory from './pages/tenants/RentalHistory';

// Add to your routing configuration
<Route path="/expenses" component={ExpenseDashboard} />
<Route path="/agent-portal" component={AgentPortal} />
<Route path="/rental-history" component={RentalHistory} />
```

---

## **STEP 3: Update Mobile Apps**

### **React Native - Expense Management**
```javascript
// src/screens/expenses/ExpenseListScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import axios from 'axios';

const ExpenseListScreen = ({ navigation }) => {
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await axios.get('/api/expenses');
      setExpenses(response.data.expenses);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const renderExpense = ({ item }) => (
    <TouchableOpacity style={styles.expenseItem}>
      <Text style={styles.expenseTitle}>{item.description}</Text>
      <Text style={styles.expenseAmount}>KES {item.amount}</Text>
      <Text style={styles.expenseCategory}>{item.expense_type}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={expenses}
        renderItem={renderExpense}
        keyExtractor={item => item._id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  expenseItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  expenseTitle: { fontSize: 16, fontWeight: 'bold' },
  expenseAmount: { fontSize: 14, color: '#007bff' },
  expenseCategory: { fontSize: 12, color: '#666' }
});

export default ExpenseListScreen;
```

### **React Native - Agent Portal**
```javascript
// src/screens/agents/AgentDashboardScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import axios from 'axios';

const AgentDashboardScreen = ({ navigation }) => {
  const [stats, setStats] = useState(null);
  const [contracts, setContracts] = useState([]);

  useEffect(() => {
    fetchAgentData();
  }, []);

  const fetchAgentData = async () => {
    try {
      const [statsResponse, contractsResponse] = await Promise.all([
        axios.get('/api/agents/stats'),
        axios.get('/api/agents/contracts')
      ]);
      setStats(statsResponse.data.agent_stats);
      setContracts(contractsResponse.data.contracts);
    } catch (error) {
      console.error('Error fetching agent data:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Agent Dashboard</Text>
      
      {stats && (
        <View style={styles.statsContainer}>
          <Text style={styles.statTitle}>Performance Metrics</Text>
          <Text>Properties Managed: {stats.performance_metrics.total_properties_managed}</Text>
          <Text>Total Revenue: KES {stats.performance_metrics.total_revenue_generated.toLocaleString()}</Text>
        </View>
      )}

      <View style={styles.contractsContainer}>
        <Text style={styles.sectionTitle}>Active Contracts</Text>
        {contracts.map(contract => (
          <TouchableOpacity key={contract._id} style={styles.contractItem}>
            <Text>{contract.landlord_id.firstName} {contract.landlord_id.lastName}</Text>
            <Text>{contract.management_type}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  statsContainer: { backgroundColor: '#f8f9fa', padding: 16, borderRadius: 8, marginBottom: 20 },
  statTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  contractsContainer: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  contractItem: { padding: 12, backgroundColor: '#fff', borderRadius: 8, marginBottom: 8 }
});

export default AgentDashboardScreen;
```

### **Navigation Updates**
```javascript
// src/navigation/AppNavigator.js
import ExpenseListScreen from '../screens/expenses/ExpenseListScreen';
import AgentDashboardScreen from '../screens/agents/AgentDashboardScreen';

// Add to your navigator
<Tab.Screen name="Expenses" component={ExpenseListScreen} />
<Tab.Screen name="Agent Portal" component={AgentDashboardScreen} />
```

---

## **STEP 4: User Acceptance Testing**

### **Test Scenarios Document**

#### **1. Expense Management Testing**
```markdown
**Test Case EXP-001: Create Expense**
- Precondition: User logged in as landlord
- Steps:
  1. Navigate to Expenses page
  2. Click "Add Expense"
  3. Fill in expense details (property, category, amount, description)
  4. Click "Save"
- Expected Result: Expense appears in expense list with correct details
- Priority: High

**Test Case EXP-002: Expense Analytics**
- Precondition: Multiple expenses exist
- Steps:
  1. Navigate to Expenses page
  2. Click "Analytics" tab
  3. Select date range
- Expected Result: Charts show expense breakdown and trends
- Priority: Medium
```

#### **2. Agent Portal Testing**
```markdown
**Test Case AGENT-001: Create Agent Profile**
- Precondition: User registered as agent
- Steps:
  1. Navigate to Agent Portal
  2. Complete profile form (agency, license, specialization)
  3. Upload verification documents
  4. Submit for verification
- Expected Result: Profile created successfully, status shows "pending"
- Priority: High

**Test Case AGENT-002: Management Contract**
- Precondition: Agent profile verified
- Steps:
  1. Navigate to Contracts section
  2. Click "Create Contract"
  3. Select landlord and properties
  4. Set commission structure
  5. Send to landlord
- Expected Result: Contract created and sent to landlord
- Priority: High
```

#### **3. Rental History Testing**
```markdown
**Test Case RH-001: Export Rental History**
- Precondition: Tenant has payment history
- Steps:
  1. Tenant logs into mobile app
  2. Navigate to "Rental History"
  3. Click "Download PDF"
- Expected Result: PDF downloaded with complete rental history
- Priority: High

**Test Case RH-002: Share Rental History**
- Precondition: PDF generated successfully
- Steps:
  1. Click "Share History"
  2. Enter recipient email
  3. Add message
  4. Click "Send"
- Expected Result: Verification code sent to recipient
- Priority: Medium
```

### **UAT Test Plan**
```bash
# Create test users
npm run seed:test-users

# Run automated tests
npm run test:uat

# Manual testing checklist
echo "1. Test all new endpoints"
echo "2. Test frontend integration"
echo "3. Test mobile app functionality"
echo "4. Test error scenarios"
echo "5. Test performance under load"
```

### **Test Data Setup**
```javascript
// scripts/createTestData.js
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Property = require('./src/models/Property');
const Expense = require('./src/models/Expense');

const createTestData = async () => {
  // Create test landlord
  const landlord = new User({
    email: 'test.landlord@nyumba360.co.ke',
    phone: '0712345678',
    password: 'password123',
    first_name: 'John',
    last_name: 'Doe',
    user_type: 'landlord'
  });

  // Create test property
  const property = new Property({
    owner_id: landlord._id,
    property_name: 'Test Apartment',
    property_type: 'apartment',
    address: {
      street: '123 Test Street',
      city: 'Nairobi',
      county: 'Nairobi'
    }
  });

  // Create test expenses
  const expenses = [
    new Expense({
      property_id: property._id,
      landlord_id: landlord._id,
      expense_type: 'repair',
      description: 'Test repair',
      amount: 1000,
      payment_method: 'mpesa'
    })
  ];

  await Promise.all([
    landlord.save(),
    property.save(),
    ...expenses.map(exp => exp.save())
  ]);

  console.log('Test data created successfully');
};

createTestData().then(() => process.exit(0));
```

---

## **STEP 5: Production Deployment**

### **Production Environment Setup**
```bash
# Create production environment file
cp .env.example .env.production

# Production configuration
echo "NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/nyumba360_prod
JWT_SECRET=super_secure_production_jwt_secret
MPESA_CONSUMER_KEY=production_consumer_key
MPESA_CONSUMER_SECRET=production_consumer_secret
MPESA_PASSKEY=production_passkey
MPESA_SHORTCODE=174379
MPESA_CALLBACK_URL=https://api.nyumba360.co.ke/payments/mpesa/callback" > .env.production
```

### **Database Production Setup**
```bash
# Create production indexes
mongosh nyumba360_prod --eval "
// Performance indexes
db.expenses.createIndex({ property_id: 1, expense_date: -1 });
db.expenses.createIndex({ landlord_id: 1, expense_date: -1 });
db.maintenance_tickets.createIndex({ property_id: 1, status: 1 });
db.vacancy_listings.createIndex({ is_active: 1, is_featured: 1 });
db.agents.createIndex({ license_number: 1 });
db.agent_managements.createIndex({ agent_id: 1, status: 1 });

// Text search indexes
db.vacancy_listings.createIndex({ title: 'text', description: 'text' });
db.properties.createIndex({ property_name: 'text', 'address.street': 'text' });

// Compound indexes
db.rent_payments.createIndex({ tenant_id: 1, payment_date: -1 });
db.lease_agreements.createIndex({ property_id: 1, status: 1 });
"
```

### **Production Deployment Commands**
```bash
# Build for production
npm run build

# Start production server
NODE_ENV=production npm start

# Or use PM2 for process management
pm2 start ecosystem.config.js --env production
```

### **Docker Production Deployment**
```dockerfile
# Dockerfile.prod
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5001

USER node

CMD ["npm", "start"]
```

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.prod
    ports:
      - "5001:5001"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    depends_on:
      - mongodb
    restart: unless-stopped

  mongodb:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped

volumes:
  mongodb_data:
```

### **Load Balancer Configuration (Nginx)**
```nginx
# /etc/nginx/sites-available/nyumba360
server {
    listen 80;
    server_name api.nyumba360.co.ke;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/notifications {
        proxy_pass http://localhost:5001;
        limit_req zone=notification;
    }

    location /api/payments {
        proxy_pass http://localhost:5001;
        limit_req zone=payment;
    }
}

# Rate limiting zones
http {
    limit_req_zone $binary_remote_addr zone=notification:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=payment:10m rate=5r/s;
}
```

### **SSL Certificate Setup**
```bash
# Install Let's Encrypt
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d api.nyumba360.co.ke

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### **Monitoring Setup**
```bash
# Install monitoring tools
npm install -g newrelic pm2

# New Relic configuration
echo "app_name='Nyumba360 Production'
license_key='your_newrelic_key'
logging.level='info'" > newrelic.js

# PM2 monitoring
pm2 install pm2-server-monit
```

### **Health Checks**
```bash
# Create health check endpoint
curl -f http://localhost:5001/api/system/status || exit 1

# Database health check
mongosh --eval "db.adminCommand('ping')" || exit 1

# Memory and CPU monitoring
pm2 monit
```

### **Backup Strategy**
```bash
# Database backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="$MONGODB_URI" --out="/backup/mongodb_$DATE"

# Compress backup
tar -czf "/backup/mongodb_$DATE.tar.gz" "/backup/mongodb_$DATE"

# Remove old backups (keep 7 days)
find /backup -name "mongodb_*.tar.gz" -mtime +7 -delete

# Upload to cloud storage (AWS S3 example)
aws s3 cp "/backup/mongodb_$DATE.tar.gz" s3://nyumba360-backups/
```

### **Deployment Verification**
```bash
# Post-deployment checklist
echo "1. Check server status: curl -f http://localhost:5001/api/system/status"
echo "2. Check database connectivity: mongosh --eval 'db.adminCommand(\"ping\")'"
echo "3. Test authentication: curl -X POST http://localhost:5001/api/auth/login"
echo "4. Test new endpoints: curl -X GET http://localhost:5001/api/expenses"
echo "5. Check logs: pm2 logs nyumba360"
echo "6. Monitor memory: pm2 monit"
echo "7. Test SSL: curl -I https://api.nyumba360.co.ke"
```

### **Rollback Plan**
```bash
# Quick rollback commands
pm2 stop nyumba360
git checkout previous_stable_tag
npm install
npm run build
pm2 start ecosystem.config.js --env production

# Database rollback (if needed)
mongosh nyumba360_prod --eval "
db.expenses.drop();
db.maintenance_tickets.drop();
db.vacancy_listings.drop();
db.agents.drop();
db.agent_managements.drop();
"
```

---

## **POST-DEPLOYMENT MONITORING**

### **Key Metrics to Monitor**
- **Response Time**: < 200ms for API calls
- **Error Rate**: < 1% for all endpoints
- **Database Performance**: < 100ms query time
- **Memory Usage**: < 80% of available memory
- **CPU Usage**: < 70% average load
- **Uptime**: > 99.9%

### **Alert Configuration**
```bash
# Set up alerts for critical issues
# 1. High error rate
# 2. Database connection failures
# 3. Memory leaks
# 4. Payment processing failures
# 5. M-Pesa callback issues
```

### **Performance Testing**
```bash
# Load testing with artillery
artillery run load-test-config.yml

# Stress testing
npm run test:stress
```

---

## **SUCCESS CRITERIA**

### **Deployment Success When:**
- [ ] All services running without errors
- [ ] Database connections stable
- [ ] New endpoints responding correctly
- [ ] Frontend integration working
- [ ] Mobile apps connecting successfully
- [ ] Payment processing functional
- [ ] SSL certificate valid
- [ ] Monitoring tools active
- [ ] Backups configured
- [ ] Performance benchmarks met

---

**Ready to execute these 5 steps for successful production deployment!**
