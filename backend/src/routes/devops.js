const express = require('express');
const DevOpsController = require('../controllers/devopsController');

const router = express.Router();

// DevOps routes - no auth required for health checks
router.get('/health', DevOpsController.getHealthCheck);
router.get('/metrics', DevOpsController.getMetrics);

// Admin-only DevOps routes
router.get('/backup', DevOpsController.generateBackup);
router.post('/restore', DevOpsController.restoreBackup);
router.get('/backups', DevOpsController.listBackups);
router.delete('/backups/cleanup', DevOpsController.cleanupBackups);
router.post('/monitoring/setup', DevOpsController.setupMonitoring);
router.post('/deploy', DevOpsController.deployApplication);
router.get('/config', DevOpsController.getDeploymentConfig);

module.exports = router;
