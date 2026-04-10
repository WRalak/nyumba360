module.exports = {
  apps: [
    {
      name: 'nyumba360-api',
      script: 'server.js',
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster', // Enable cluster mode
      watch: false, // Disable watching in production
      max_memory_restart: '1G', // Restart if memory exceeds 1GB
      env: {
        NODE_ENV: 'development',
        PORT: 5001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5001
      },
      // Logging configuration
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Advanced configuration
      min_uptime: '10s',
      max_restarts: 10,
      autorestart: true,
      
      // Health check
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      
      // Process management
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Monitoring
      pmx: true,
      
      // Custom configuration
      node_args: '--max-old-space-size=1024',
      
      // Environment variables
      env_file: '.env',
      
      // Restart strategy
      restart_delay: 4000,
      
      // Additional monitoring
      monitoring: false,
      
      // Instance variables
      instance_var: 'INSTANCE_ID',
      
      // Disable inter-process communication
      pmx: false,
      
      // Enable PM2 monitoring
      pmx: true,
      
      // Custom hooks
      post_start: 'echo "Application started"',
      post_restart: 'echo "Application restarted"',
      post_stop: 'echo "Application stopped"'
    }
  ],
  
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/nyumba360.git',
      path: '/var/www/nyumba360',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      'ssh_options': 'StrictHostKeyChecking=no'
    },
    
    staging: {
      user: 'deploy',
      host: 'staging-server.com',
      ref: 'origin/develop',
      repo: 'git@github.com:your-username/nyumba360.git',
      path: '/var/www/nyumba360-staging',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging',
      env: {
        NODE_ENV: 'staging'
      }
    }
  }
};
