# Database Setup Guide

## Neon PostgreSQL Configuration

Your Neon PostgreSQL connection string has been updated in the configuration files.

### Connection String
```
postgresql://neondb_owner:npg_mPAyUGBxe8z1@ep-fragrant-term-antif9g7-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

## Setup Instructions

### 1. Create Your Local Environment File

Create a `.env` file in the root directory with your actual credentials:

```bash
# Copy the example file
cp .env.example .env

# Update with your actual Neon credentials
```

### 2. Update Your .env File

Add your actual Neon PostgreSQL connection string:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/nyumba360_dev

# PostgreSQL Connection String (Neon)
POSTGRES_URI=postgresql://neondb_owner:npg_mPAyUGBxe8z1@ep-fragrant-term-antif9g7-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Database Options
DB_NAME=nyumba360_dev
DB_MAX_CONNECTIONS=10
DB_CONNECTION_TIMEOUT=10000

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_change_this_in_production
JWT_EXPIRES_IN=7d
```

### 3. Backend Environment File

Create/update `backend/.env`:

```env
# Database Configuration
MONGODB_URI=mongodb+srv://your_username:your_password@cluster0.mongodb.net/nyumba360?retryWrites=true&w=majority

# PostgreSQL Configuration (Neon)
POSTGRES_URI=postgresql://neondb_owner:npg_mPAyUGBxe8z1@ep-fragrant-term-antif9g7-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5001
NODE_ENV=development
```

### 4. Docker Deployment

For Docker deployment, create a `.env` file with:

```env
# Docker Environment Variables
MONGODB_URI=mongodb+srv://your_username:your_password@cluster0.mongodb.net/nyumba360?retryWrites=true&w=majority
POSTGRES_URI=postgresql://neondb_owner:npg_mPAyUGBxe8z1@ep-fragrant-term-antif9g7-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=your_super_secure_jwt_secret_key_change_this_in_production
```

Then run:
```bash
docker-compose up --build
```

## Neon Database Connection Details

### Host Information
- **Host**: `ep-fragrant-term-antif9g7-pooler.c-6.us-east-1.aws.neon.tech`
- **Database**: `neondb`
- **User**: `neondb_owner`
- **SSL Mode**: `require`
- **Channel Binding**: `require`

### Connection Parameters
- **Port**: 5432 (default PostgreSQL port)
- **SSL**: Required (Neon enforces SSL)
- **Connection Pooling**: Enabled via pooler

## Using the Database

### Node.js with pg
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URI,
});

// Example query
async function getUsers() {
  const result = await pool.query('SELECT * FROM users');
  return result.rows;
}
```

### Node.js with Sequelize
```javascript
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.POSTGRES_URI, {
  dialect: 'postgres',
  logging: false,
});

// Test connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Neon PostgreSQL connection successful');
  } catch (error) {
    console.error('Unable to connect to Neon:', error);
  }
}
```

### Node.js with Prisma
```prisma
// schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("POSTGRES_URI")
}
```

## Security Notes

### Important Security Reminders
1. **Never commit actual credentials** to version control
2. **Use environment variables** for all sensitive data
3. **Rotate passwords regularly** for production
4. **Use connection pooling** for better performance
5. **Enable SSL** (already enforced by Neon)

### Environment Variable Protection
- `.env` files are automatically ignored by Git
- Use `.env.example` for template values
- Never share your actual connection string

## Testing the Connection

### Test with Node.js
```javascript
// test-connection.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URI,
});

async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('Connected to Neon PostgreSQL:', result.rows[0]);
    client.release();
  } catch (error) {
    console.error('Connection failed:', error);
  } finally {
    await pool.end();
  }
}

testConnection();
```

### Test with psql
```bash
psql "postgresql://neondb_owner:npg_mPAyUGBxe8z1@ep-fragrant-term-antif9g7-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

## Troubleshooting

### Common Issues

#### Connection Timeout
- Check your password is correct
- Ensure SSL is enabled
- Verify the host address

#### Authentication Failed
- Double-check the username and password
- Ensure the password doesn't contain special characters that need escaping
- Verify the database name is correct

#### SSL Issues
- Neon requires SSL connections
- Ensure your PostgreSQL client supports SSL
- Check firewall settings if applicable

### Performance Tips

1. **Connection Pooling**: Use Neon's connection pooler
2. **Indexing**: Add proper indexes to frequently queried columns
3. **Query Optimization**: Use EXPLAIN ANALYZE for slow queries
4. **Connection Management**: Close connections when done

## Next Steps

1. **Update your local .env file** with the actual password
2. **Test the connection** using the provided examples
3. **Update your application code** to use the POSTGRES_URI
4. **Run database migrations** if needed
5. **Monitor performance** in the Neon dashboard

## Support

For Neon-specific issues:
- Check the Neon dashboard
- Review Neon documentation
- Contact Neon support if needed

For application-specific issues:
- Review the application code
- Check environment variable loading
- Verify network connectivity
