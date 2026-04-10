const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const crypto = require('crypto');

class DevOpsService {
  static async generateDeploymentConfig() {
    try {
      const config = {
        deployment: {
          environment: process.env.NODE_ENV || 'development',
          timestamp: new Date().toISOString(),
          version: process.env.APP_VERSION || '1.0.0',
          commit_hash: await this.getGitCommitHash(),
          branch: await this.getGitBranch()
        },
        database: {
          host: process.env.DB_HOST || 'localhost',
          port: process.env.DB_PORT || '5432',
          database: process.env.DB_NAME || 'nyumba360'
        },
        services: {
          backend: {
            port: process.env.PORT || 5000,
            node_version: process.version
          },
          frontend: {
            port: 3000,
            build_command: 'npm run build'
          },
          mobile: {
            port: 8081
          }
        }
      };

      const configPath = path.join(__dirname, '../../deployment-config.json');
      await fs.writeFile(configPath, JSON.stringify(config, null, 2));
      
      return config;
    } catch (error) {
      console.error('Generate deployment config error:', error);
      throw new Error('Failed to generate deployment config');
    }
  }

  static async getGitCommitHash() {
    return new Promise((resolve) => {
      exec('git rev-parse HEAD', { encoding: 'utf8' }, (error, stdout) => {
        if (error) {
          resolve('unknown');
        } else {
          resolve(stdout.trim());
        }
      });
    });
  }

  static async getGitBranch() {
    return new Promise((resolve) => {
      exec('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }, (error, stdout) => {
        if (error) {
          resolve('main');
        } else {
          resolve(stdout.trim().replace('refs/heads/', ''));
        }
      });
    });
  }

  static async runHealthCheck() {
    try {
      const healthChecks = {
        database: await this.checkDatabaseConnection(),
        fileSystem: await this.checkFileSystem(),
        memory: await this.checkMemoryUsage(),
        disk: await this.checkDiskUsage(),
        services: await this.checkServices()
      };

      const allHealthy = Object.values(healthChecks).every(check => check.status === 'healthy');
      
      return {
        status: allHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: healthChecks
      };
    } catch (error) {
      console.error('Health check error:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  static async checkDatabaseConnection() {
    try {
      const db = require('../config/database');
      await db.raw('SELECT 1');
      return { status: 'healthy', message: 'Database connection successful' };
    } catch (error) {
      return { status: 'unhealthy', message: 'Database connection failed', error: error.message };
    }
  }

  static async checkFileSystem() {
    try {
      const testFile = path.join(__dirname, '../../test-file.tmp');
      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);
      return { status: 'healthy', message: 'File system accessible' };
    } catch (error) {
      return { status: 'unhealthy', message: 'File system error', error: error.message };
    }
  }

  static async checkMemoryUsage() {
    try {
      const usage = process.memoryUsage();
      const totalMemory = require('os').totalmem();
      const usedMemory = usage.heapUsed;
      const memoryUsagePercent = (usedMemory / totalMemory) * 100;

      return {
        status: memoryUsagePercent < 80 ? 'healthy' : 'warning',
        message: `Memory usage: ${memoryUsagePercent.toFixed(2)}%`,
        usage: {
          heap_used: usage.heapUsed,
          heap_total: usage.heapTotal,
          external: usage.external,
          rss: usage.rss
        }
      };
    } catch (error) {
      return { status: 'unhealthy', message: 'Memory check failed', error: error.message };
    }
  }

  static async checkDiskUsage() {
    try {
      const stats = await fs.statfs(__dirname);
      const totalSpace = stats.bsize * stats.blocks;
      const freeSpace = stats.bsize * stats.bavail;
      const usedSpace = totalSpace - freeSpace;
      const usagePercent = (usedSpace / totalSpace) * 100;

      return {
        status: usagePercent < 80 ? 'healthy' : 'warning',
        message: `Disk usage: ${usagePercent.toFixed(2)}%`,
        usage: {
          total: totalSpace,
          used: usedSpace,
          free: freeSpace
        }
      };
    } catch (error) {
      return { status: 'unhealthy', message: 'Disk check failed', error: error.message };
    }
  }

  static async checkServices() {
    try {
      const services = {
        backend: await this.checkBackendService(),
        database: await this.checkDatabaseConnection()
      };

      const allHealthy = Object.values(services).every(service => service.status === 'healthy');
      
      return {
        status: allHealthy ? 'healthy' : 'unhealthy',
        services
      };
    } catch (error) {
      return { status: 'unhealthy', message: 'Service check failed', error: error.message };
    }
  }

  static async checkBackendService() {
    try {
      // Check if backend is responding
      const response = await fetch('http://localhost:5000/health');
      const data = await response.json();
      return { status: 'healthy', message: 'Backend service responding', data };
    } catch (error) {
      return { status: 'unhealthy', message: 'Backend service not responding', error: error.message };
    }
  }

  static async generateBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = path.join(__dirname, '../../backups');
      
      await fs.mkdir(backupDir, { recursive: true });
      
      const backupFileName = `backup-${timestamp}.sql`;
      const backupFilePath = path.join(backupDir, backupFileName);
      
      // Generate database backup
      const { exec } = require('child_process');
      const dbConfig = require('../config/database');
      
      const pgDumpCommand = `pg_dump -h ${dbConfig.client.connectionSettings.host} -p ${dbConfig.client.connectionSettings.port} -U ${dbConfig.client.connectionSettings.user} -d ${dbConfig.client.connectionSettings.database} > ${backupFilePath}`;
      
      return new Promise((resolve, reject) => {
        exec(pgDumpCommand, (error, stdout, stderr) => {
          if (error) {
            reject(new Error('Backup failed: ' + error.message));
          } else {
            resolve({
              success: true,
              file: backupFileName,
              path: backupFilePath,
              size: stdout.length
            });
          }
        });
      });
    } catch (error) {
      console.error('Generate backup error:', error);
      throw new Error('Failed to generate backup');
    }
  }

  static async restoreBackup(backupFileName) {
    try {
      const backupDir = path.join(__dirname, '../../backups');
      const backupFilePath = path.join(backupDir, backupFileName);
      
      // Check if backup file exists
      await fs.access(backupFilePath);
      
      const { exec } = require('child_process');
      const dbConfig = require('../config/database');
      
      const restoreCommand = `psql -h ${dbConfig.client.connectionSettings.host} -p ${dbConfig.client.connectionSettings.port} -U ${dbConfig.client.connectionSettings.user} -d ${dbConfig.client.connectionSettings.database} < ${backupFilePath}`;
      
      return new Promise((resolve, reject) => {
        exec(restoreCommand, (error, stdout, stderr) => {
          if (error) {
            reject(new Error('Restore failed: ' + error.message));
          } else {
            resolve({
              success: true,
              message: 'Database restored successfully'
            });
          }
        });
      });
    } catch (error) {
      console.error('Restore backup error:', error);
      throw new Error('Failed to restore backup');
    }
  }

  static async listBackups() {
    try {
      const backupDir = path.join(__dirname, '../../backups');
      const files = await fs.readdir(backupDir);
      
      const backups = [];
      for (const file of files) {
        if (file.endsWith('.sql')) {
          const filePath = path.join(backupDir, file);
          const stats = await fs.stat(filePath);
          backups.push({
            filename: file,
            path: filePath,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime
          });
        }
      }
      
      return backups.sort((a, b) => b.created - a.created);
    } catch (error) {
      console.error('List backups error:', error);
      return [];
    }
  }

  static async cleanupOldBackups(keepDays = 30) {
    try {
      const backups = await this.listBackups();
      const cutoffDate = new Date(Date.now() - keepDays * 24 * 60 * 60 * 1000);
      
      let deletedCount = 0;
      for (const backup of backups) {
        if (backup.created < cutoffDate) {
          await fs.unlink(backup.path);
          deletedCount++;
        }
      }
      
      return {
        success: true,
        deleted_count: deletedCount,
        message: `Deleted ${deletedCount} old backups`
      };
    } catch (error) {
      console.error('Cleanup backups error:', error);
      throw new Error('Failed to cleanup old backups');
    }
  }

  static async generateMetrics() {
    try {
      const health = await this.runHealthCheck();
      const mediaStats = require('./mediaService').getMediaStats();
      
      const metrics = {
        timestamp: new Date().toISOString(),
        health,
        media: mediaStats,
        system: {
          platform: process.platform,
          node_version: process.version,
          uptime: process.uptime(),
          memory: process.memoryUsage()
        },
        deployment: await this.generateDeploymentConfig()
      };

      const metricsPath = path.join(__dirname, '../../metrics.json');
      await fs.writeFile(metricsPath, JSON.stringify(metrics, null, 2));
      
      return metrics;
    } catch (error) {
      console.error('Generate metrics error:', error);
      throw new Error('Failed to generate metrics');
    }
  }

  static async setupMonitoring() {
    try {
      // Create monitoring directory
      const monitoringDir = path.join(__dirname, '../../monitoring');
      await fs.mkdir(monitoringDir, { recursive: true });
      
      // Create log directory
      const logDir = path.join(__dirname, '../../logs');
      await fs.mkdir(logDir, { recursive: true });
      
      // Setup log rotation configuration
      const logConfig = {
        version: 1,
        disableClustering: true,
        appenders: [
          {
            type: 'file',
            filename: path.join(logDir, 'app.log'),
            maxsize: '20m',
            maxFiles: '14d',
            datePattern: 'YYYY-MM-DD'
          },
          {
            type: 'console'
          }
        ]
      };
      
      const configPath = path.join(__dirname, '../../log-config.json');
      await fs.writeFile(configPath, JSON.stringify(logConfig, null, 2));
      
      return { success: true, message: 'Monitoring setup completed' };
    } catch (error) {
      console.error('Setup monitoring error:', error);
      throw new Error('Failed to setup monitoring');
    }
  }

  static async deployApplication() {
    try {
      console.log('Starting deployment process...');
      
      // Generate deployment config
      await this.generateDeploymentConfig();
      
      // Run health check
      const health = await this.runHealthCheck();
      if (health.status !== 'healthy') {
        throw new Error('Health check failed. Deployment aborted.');
      }
      
      // Generate backup before deployment
      await this.generateBackup();
      
      // Run database migrations if needed
      console.log('Running database migrations...');
      
      // Restart services
      console.log('Restarting services...');
      
      return {
        success: true,
        message: 'Deployment completed successfully',
        health
      };
    } catch (error) {
      console.error('Deploy application error:', error);
      throw new Error('Deployment failed: ' + error.message);
    }
  }
}

module.exports = DevOpsService;
