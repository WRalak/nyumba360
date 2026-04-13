# Docker Deployment Guide

## Overview

This guide explains how to deploy the Nyumba360 property management application using Docker and Docker Compose.

## Prerequisites

- Docker installed on your system
- Docker Compose installed on your system
- Git (to clone the repository)

## Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/WRalak/nyumba360.git
cd nyumba360
```

### 2. Environment Configuration
Copy the environment files and update them with your actual values:

```bash
# Backend environment
cp backend/.env.example backend/.env

# Frontend environment (optional, defaults are provided)
cp frontend/.env.example frontend/.env
```

### 3. Build and Run with Docker Compose
```bash
# Build and start all services
docker-compose up --build

# Run in detached mode
docker-compose up --build -d
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5001
- **Health Check**: http://localhost:5001/api/health

## Services

### Frontend Service
- **Image**: Built from `frontend/Dockerfile`
- **Port**: 3000 (mapped to container port 80)
- **Technology**: Nginx serving React build files
- **Features**: Gzip compression, caching, security headers

### Backend Service
- **Image**: Built from `backend/Dockerfile`
- **Port**: 5001
- **Technology**: Node.js with Express
- **Features**: Health checks, file upload support, mock authentication

## Environment Variables

### Backend Environment Variables
```env
NODE_ENV=production
PORT=5001
CORS_ORIGIN=http://localhost:3000
MONGODB_URI=mongodb+srv://your-connection-string
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d
```

### Frontend Environment Variables
```env
VITE_API_URL=http://localhost:5001/api
```

## Development vs Production

### Development
```bash
# Run with hot reload (not recommended for production)
docker-compose up --build
```

### Production
```bash
# Run in detached mode with optimized builds
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Volume Management

### Uploads Volume
The backend service uses a named volume `uploads` to persist file uploads:

```bash
# View volume details
docker volume inspect nyumba360_uploads

# Backup uploads
docker run --rm -v nyumba360_uploads:/data -v $(pwd):/backup alpine tar czf /backup/uploads-backup.tar.gz -C /data .

# Restore uploads
docker run --rm -v nyumba360_uploads:/data -v $(pwd):/backup alpine tar xzf /backup/uploads-backup.tar.gz -C /data
```

## Monitoring

### Health Checks
Both services include health checks:

```bash
# Check service health
docker-compose ps

# View health check logs
docker-compose logs backend
```

### Logs
```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs frontend
docker-compose logs backend

# Follow logs in real-time
docker-compose logs -f
```

## Scaling

### Horizontal Scaling
```bash
# Scale backend service
docker-compose up --scale backend=3

# Scale frontend service (usually not needed with nginx)
docker-compose up --scale frontend=2
```

## Security Considerations

### Production Security
1. **Update secrets**: Replace default JWT secrets and database credentials
2. **Network isolation**: Services communicate via internal Docker network
3. **SSL/TLS**: Configure SSL termination in production
4. **Firewall**: Restrict access to ports 3000 and 5001

### Recommended Security Headers
The frontend Nginx configuration includes:
- X-Frame-Options
- X-XSS-Protection
- X-Content-Type-Options
- Content-Security-Policy

## Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Check what's using the ports
netstat -tulpn | grep :3000
netstat -tulpn | grep :5001

# Kill conflicting processes
sudo kill -9 <PID>
```

#### Build Failures
```bash
# Clean build cache
docker-compose down
docker system prune -f
docker-compose up --build
```

#### Database Connection Issues
```bash
# Check backend logs for database errors
docker-compose logs backend

# Verify MongoDB URI in backend/.env
```

#### Permission Issues
```bash
# Fix volume permissions
sudo chown -R $USER:$USER ./backend/uploads
```

### Debug Mode
```bash
# Run with debug logging
docker-compose up --build --force-recreate

# Enter container for debugging
docker-compose exec backend sh
docker-compose exec frontend sh
```

## Performance Optimization

### Production Optimizations
1. **Multi-stage builds**: Reduce image sizes
2. **Nginx caching**: Static asset caching
3. **Gzip compression**: Response compression
4. **Health checks**: Automated monitoring

### Resource Limits
Add resource limits to `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

## Backup and Recovery

### Application Backup
```bash
# Backup entire application
docker-compose down
tar czf nyumba360-backup.tar.gz .

# Restore application
tar xzf nyumba360-backup.tar.gz
docker-compose up --build -d
```

### Data Backup
```bash
# Backup uploads volume
docker run --rm -v nyumba360_uploads:/data -v $(pwd):/backup alpine tar czf /backup/uploads-$(date +%Y%m%d).tar.gz -C /data .
```

## Next Steps

1. **Configure SSL**: Set up SSL certificates for production
2. **Load Balancing**: Configure load balancer for high availability
3. **Monitoring**: Set up monitoring and alerting
4. **CI/CD**: Implement automated deployment pipeline

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review container logs
3. Verify environment configuration
4. Check Docker and Docker Compose versions
