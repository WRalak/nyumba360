const { validationResult } = require('express-validator');
const DevOpsService = require('../services/devopsService');

class DevOpsController {
  static async getHealthCheck(req, res) {
    try {
      const health = await DevOpsService.runHealthCheck();
      
      res.status(health.status === 'healthy' ? 200 : 503).json({
        message: health.status === 'healthy' ? 'System is healthy' : 'System has issues',
        health
      });
    } catch (error) {
      console.error('Health check error:', error);
      res.status(500).json({
        error: 'Failed to perform health check',
        message: error.message
      });
    }
  }

  static async getMetrics(req, res) {
    try {
      const metrics = await DevOpsService.generateMetrics();
      
      res.json({
        message: 'System metrics retrieved successfully',
        metrics
      });
    } catch (error) {
      console.error('Get metrics error:', error);
      res.status(500).json({
        error: 'Failed to retrieve metrics',
        message: error.message
      });
    }
  }

  static async generateBackup(req, res) {
    try {
      const backup = await DevOpsService.generateBackup();
      
      res.json({
        message: 'Backup generated successfully',
        backup
      });
    } catch (error) {
      console.error('Generate backup error:', error);
      res.status(500).json({
        error: 'Failed to generate backup',
        message: error.message
      });
    }
  }

  static async restoreBackup(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { backup_filename } = req.body;
      
      const result = await DevOpsService.restoreBackup(backup_filename);
      
      res.json({
        message: 'Backup restored successfully',
        ...result
      });
    } catch (error) {
      console.error('Restore backup error:', error);
      res.status(500).json({
        error: 'Failed to restore backup',
        message: error.message
      });
    }
  }

  static async listBackups(req, res) {
    try {
      const backups = await DevOpsService.listBackups();
      
      res.json({
        message: 'Backups listed successfully',
        backups
      });
    } catch (error) {
      console.error('List backups error:', error);
      res.status(500).json({
        error: 'Failed to list backups',
        message: error.message
      });
    }
  }

  static async cleanupBackups(req, res) {
    try {
      const { keep_days = 30 } = req.body;
      
      const result = await DevOpsService.cleanupOldBackups(keep_days);
      
      res.json({
        message: 'Backup cleanup completed successfully',
        ...result
      });
    } catch (error) {
      console.error('Cleanup backups error:', error);
      res.status(500).json({
        error: 'Failed to cleanup backups',
        message: error.message
      });
    }
  }

  static async setupMonitoring(req, res) {
    try {
      const result = await DevOpsService.setupMonitoring();
      
      res.json({
        message: 'Monitoring setup completed',
        ...result
      });
    } catch (error) {
      console.error('Setup monitoring error:', error);
      res.status(500).json({
        error: 'Failed to setup monitoring',
        message: error.message
      });
    }
  }

  static async deployApplication(req, res) {
    try {
      const result = await DevOpsService.deployApplication();
      
      res.json({
        message: 'Application deployed successfully',
        ...result
      });
    } catch (error) {
      console.error('Deploy application error:', error);
      res.status(500).json({
        error: 'Deployment failed',
        message: error.message
      });
    }
  }

  static async getDeploymentConfig(req, res) {
    try {
      const config = await DevOpsService.generateDeploymentConfig();
      
      res.json({
        message: 'Deployment config retrieved successfully',
        config
      });
    } catch (error) {
      console.error('Get deployment config error:', error);
      res.status(500).json({
        error: 'Failed to retrieve deployment config',
        message: error.message
      });
    }
  }
}

module.exports = DevOpsController;
