# NYUMBA360 ENVIRONMENT SETUP GUIDE

## **COMPLETE ENVIRONMENT CONFIGURATION**

---

## **ENVIRONMENT FILES CREATED**

I have created 4 comprehensive environment files for the Nyumba360 platform:

### **1. `.env.example`** - Template file
- Complete template with all possible variables
- Detailed comments explaining each variable
- Reference for setting up new environments

### **2. `.env`** - Development environment
- Local development configuration
- Mock services for testing
- Development-specific settings

### **3. `.env.production`** - Production environment
- Production-ready configuration
- Security best practices
- Performance optimizations

### **4. `.env.staging`** - Staging environment
- Pre-production testing
- Integration testing setup
- Staging-specific configurations

### **5. `.env.test`** - Testing environment
- Unit and integration testing
- Mock services enabled
- Test database configuration

---

## **QUICK SETUP**

### **Step 1: Copy the template**
```bash
# Copy the example file to create your local environment
cp .env.example .env
```

### **Step 2: Update critical values**
```bash
# Edit the .env file and update these critical values:
# - JWT_SECRET (use a strong, random string)
# - MONGODB_URI (your MongoDB connection string)
# - MPESA_CONSUMER_KEY (your M-Pesa API keys)
# - EMAIL_API_KEY (your email service API key)
# - AFRICASTALKING_USERNAME (your SMS service credentials)
```

### **Step 3: Test the configuration**
```bash
# Start the backend server
cd backend
npm start

# The server should start without errors
```

---

## **ENVIRONMENT VARIABLE EXPLANATIONS**

### **Core Configuration**
```bash
NODE_ENV=development          # Environment: development, staging, production, test
PORT=5001                     # Server port
HOST=localhost                # Server host
```

### **Database Configuration**
```bash
MONGODB_URI=mongodb://localhost:27017/nyumba360_dev
DB_NAME=nyumba360_dev
DB_MAX_CONNECTIONS=10
DB_CONNECTION_TIMEOUT=10000
```

### **JWT Authentication**
```bash
JWT_SECRET=your_super_secure_jwt_secret_key
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
```

### **M-Pesa Integration**
```bash
MPESA_CONSUMER_KEY=your_mpesa_consumer_key
MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret
MPESA_PASSKEY=your_mpesa_passkey
MPESA_SHORTCODE=174379
MPESA_ENVIRONMENT=sandbox     # sandbox or live
```

### **Email Service**
```bash
EMAIL_SERVICE=sendgrid
EMAIL_API_KEY=your_sendgrid_api_key
EMAIL_FROM=noreply@nyumba360.co.ke
EMAIL_FROM_NAME=Nyumba360
```

### **SMS Service**
```bash
AFRICASTALKING_USERNAME=your_africastalking_username
AFRICASTALKING_API_KEY=your_africastalking_api_key
AFRICASTALKING_SENDER=Nyumba360
```

### **File Upload**
```bash
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760        # 10MB
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx
```

### **Security**
```bash
CORS_ORIGIN=http://localhost:3000,http://localhost:19006
RATE_LIMIT_WINDOW_MS=900000   # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
SESSION_SECRET=your_session_secret_key
```

### **AI Configuration**
```bash
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-3.5-turbo
ML_CONFIDENCE_THRESHOLD=0.8
ENABLE_AI_FEATURES=true
```

---

## **ENVIRONMENT-SPECIFIC SETUP**

### **Development Environment (.env)**
```bash
NODE_ENV=development
PORT=5001
MONGODB_URI=mongodb://localhost:27017/nyumba360_dev
MPESA_ENVIRONMENT=sandbox
ENABLE_AI_FEATURES=true
MOCK_DATA=true
```

### **Production Environment (.env.production)**
```bash
NODE_ENV=production
PORT=5001
HOST=0.0.0.0
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/nyumba360_prod
MPESA_ENVIRONMENT=live
JWT_SECRET=super_secure_production_secret
ENABLE_MONITORING=true
```

### **Staging Environment (.env.staging)**
```bash
NODE_ENV=staging
PORT=5002
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/nyumba360_staging
MPESA_ENVIRONMENT=sandbox
ENABLE_SOCIAL_LOGIN=true
ENABLE_INTERNATIONAL_PAYMENTS=false
```

### **Testing Environment (.env.test)**
```bash
NODE_ENV=test
PORT=5003
MONGODB_URI=mongodb://localhost:27017/nyumba360_test
EMAIL_SERVICE=mock
REACT_APP_MOCK_API=true
MOCK_MPESA=true
CLEANUP_AFTER_TESTS=true
```

---

## **SECURITY BEST PRACTICES**

### **1. Never Commit .env Files**
```bash
# Add to .gitignore
.env
.env.local
.env.production
.env.staging
.env.test
```

### **2. Use Strong Secrets**
```bash
# Generate strong secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### **3. Environment-Specific Secrets**
- **Development**: Use test/development keys
- **Staging**: Use staging API keys
- **Production**: Use production API keys only

### **4. Regular Rotation**
- Rotate JWT secrets every 90 days
- Update API keys regularly
- Monitor for compromised credentials

---

## **API KEY SETUP GUIDE**

### **M-Pesa Daraja API**
1. Go to [Safaricom Developer Portal](https://developer.safaricom.co.ke)
2. Create an account
3. Create a new app
4. Get Consumer Key and Secret
5. Request Lipa na M-Pesa Online Passkey
6. Update environment variables

### **SendGrid Email Service**
1. Sign up at [SendGrid](https://sendgrid.com)
2. Create an API key
3. Verify your sender domain
4. Update EMAIL_API_KEY

### **Africa's Talking SMS**
1. Sign up at [Africa's Talking](https://africastalking.com)
2. Get username and API key
3. Update SMS environment variables

### **OpenAI API (Optional)**
1. Sign up at [OpenAI](https://openai.com)
2. Create an API key
3. Update OPENAI_API_KEY

### **Google Maps API**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable Maps JavaScript API
3. Create API key
4. Update GOOGLE_MAPS_API_KEY

---

## **FRONTEND ENVIRONMENT SETUP**

### **React Frontend (.env)**
```bash
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_MOCK_API=false
REACT_APP_ENVIRONMENT=development
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### **React Native Mobile (.env)**
```bash
EXPO_PUBLIC_API_URL=http://localhost:5001/api
EXPO_PUBLIC_MOCK_API=false
EXPO_PUSH_NOTIFICATION_KEY=your_expo_push_key
```

---

## **DOCKER ENVIRONMENT SETUP**

### **Docker Compose Environment Variables**
```yaml
# docker-compose.yml
services:
  backend:
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/nyumba360
      - JWT_SECRET=${JWT_SECRET}
      - MPESA_CONSUMER_KEY=${MPESA_CONSUMER_KEY}
```

### **Production Docker Environment**
```bash
# Create .env.production for Docker
docker-compose --env-file .env.production up -d
```

---

## **ENVIRONMENT VALIDATION**

### **Validation Script**
```javascript
// scripts/validate-env.js
const requiredEnvVars = [
  'NODE_ENV',
  'MONGODB_URI',
  'JWT_SECRET',
  'MPESA_CONSUMER_KEY',
  'MPESA_CONSUMER_SECRET'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars);
  process.exit(1);
}

console.log('Environment validation passed');
```

### **Startup Validation**
```bash
# Add to package.json scripts
"scripts": {
  "validate-env": "node scripts/validate-env.js",
  "start": "npm run validate-env && node server.js"
}
```

---

## **TROUBLESHOOTING**

### **Common Issues**

#### **1. MongoDB Connection Error**
```bash
# Check MongoDB URI format
MONGODB_URI=mongodb://localhost:27017/nyumba360_dev

# For MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nyumba360_prod?retryWrites=true&w=majority
```

#### **2. M-Pesa API Error**
```bash
# Verify API keys are correct
# Check environment is set correctly (sandbox/live)
# Ensure callback URLs are accessible
```

#### **3. Email Service Error**
```bash
# Verify SendGrid API key
# Check sender domain is verified
# Test with a simple email
```

#### **4. CORS Issues**
```bash
# Check CORS_ORIGIN includes your frontend URL
CORS_ORIGIN=http://localhost:3000,http://localhost:19006
```

### **Debug Mode**
```bash
# Enable debug logging
DEBUG=nyumba360:*
LOG_LEVEL=debug
```

---

## **ENVIRONMENT DEPLOYMENT**

### **Development Deployment**
```bash
# Use development environment
cp .env .env.local
npm start
```

### **Staging Deployment**
```bash
# Use staging environment
cp .env.staging .env.production
docker-compose --env-file .env.production up -d
```

### **Production Deployment**
```bash
# Use production environment
cp .env.production .env.production
# Update with real production values
docker-compose --env-file .env.production up -d
```

---

## **MONITORING ENVIRONMENT VARIABLES**

### **Environment Health Check**
```bash
# Check all required variables are set
npm run validate-env

# Test database connection
npm run test-db

# Test external APIs
npm run test-apis
```

### **Environment Monitoring**
```bash
# Monitor environment variable usage
grep -r "process.env" src/

# Check for hardcoded values
grep -r "localhost" src/
grep -r "password" src/
```

---

## **BEST PRACTICES SUMMARY**

1. **Never commit .env files** to version control
2. **Use different environments** for development, staging, and production
3. **Generate strong secrets** for JWT and session management
4. **Regularly rotate API keys** and secrets
5. **Use environment-specific configurations** for each deployment
6. **Validate environment variables** at startup
7. **Monitor for leaked credentials** in logs and code
8. **Use mock services** for development and testing
9. **Document all environment variables** for team reference
10. **Implement proper error handling** for missing variables

---

## **NEXT STEPS**

1. **Update your local .env file** with your actual API keys
2. **Test the configuration** by starting the development server
3. **Set up staging environment** for integration testing
4. **Prepare production environment** with real API keys
5. **Implement environment validation** in your startup scripts
6. **Set up monitoring** for environment variable usage

**Your Nyumba360 environment is now properly configured for all development stages!**
