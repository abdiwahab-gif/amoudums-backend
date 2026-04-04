# Deployment Guide

## Production Deployment

This guide provides instructions for deploying the Academic Backend to production.

## Prerequisites

- Node.js 18+ LTS
- MySQL 8.0+
- Linux server (Ubuntu 22.04 recommended)
- SSL certificate (Let's Encrypt)
- Domain name
- PM2 or similar process manager

## Step 1: Server Setup

### Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### Install PM2
```bash
sudo npm install -g pm2
```

### Create Application User
```bash
sudo useradd -m -s /bin/bash academic-api
sudo su - academic-api
```

## Step 2: MySQL Setup

### Install MySQL Server
```bash
sudo apt install -y mysql-server
sudo mysql_secure_installation
```

### Create Database and User
```bash
sudo mysql -u root -p
```

```sql
CREATE DATABASE academic_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'academic_user'@'localhost' IDENTIFIED BY 'strong_password_here';

GRANT ALL PRIVILEGES ON academic_db.* TO 'academic_user'@'localhost';

FLUSH PRIVILEGES;

EXIT;
```

### Verify Connection
```bash
mysql -u academic_user -p academic_db -e "SELECT 1;"
```

## Step 3: Application Setup

### Clone Repository
```bash
cd /home/academic-api
git clone <repository-url> .
```

### Install Dependencies
```bash
npm install --production
```

### Build Application
```bash
npm run build
```

### Configure Environment
```bash
cp .env.example .env
nano .env
```

Update `.env` with production values:
```
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=academic_user
DB_PASSWORD=strong_password_here
DB_NAME=academic_db
JWT_SECRET=your-production-secret-key-minimum-32-chars
JWT_EXPIRY=7d
CORS_ORIGIN=https://yourdomain.com
API_URL=https://api.yourdomain.com
```

## Step 4: Process Management with PM2

## Database Migrations (Automatic)

On every server start, the backend automatically runs idempotent database migrations (table creation + security enhancements) before it begins listening for requests.

- Default: enabled
- To disable (only if you run migrations separately): set `RUN_MIGRATIONS_ON_STARTUP=false` in your `.env`

### Start Application
```bash
pm2 start dist/server.js --name "academic-api"
```

### Configure Auto-start
```bash
pm2 startup
pm2 save
```

### Monitor Application
```bash
pm2 status
pm2 logs academic-api
pm2 monit
```

## Step 5: Nginx Reverse Proxy

### Install Nginx
```bash
sudo apt install -y nginx
```

### Create Configuration
```bash
sudo nano /etc/nginx/sites-available/api.yourdomain.com
```

```nginx
upstream academic_api {
  server localhost:5000;
}

server {
  listen 80;
  listen [::]:80;
  server_name api.yourdomain.com;

  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;
  server_name api.yourdomain.com;

  ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;
  ssl_prefer_server_ciphers on;

  client_max_body_size 10M;

  # Gzip compression
  gzip on;
  gzip_types text/plain text/css text/javascript application/json;
  gzip_min_length 1000;

  location / {
    proxy_pass http://academic_api;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
  }
}
```

### Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/api.yourdomain.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 6: SSL Certificate

### Using Let's Encrypt with Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot certonly --standalone -d api.yourdomain.com
sudo certbot renew --dry-run
```

## Step 7: Monitoring and Logging

### Configure Logging
```bash
mkdir -p ~/logs
pm2 start dist/server.js --name "academic-api" --error ~/logs/error.log --out ~/logs/out.log
```

### Monitor with PM2 Plus (Optional)
```bash
pm2 install pm2-auto-pull
pm2 install pm2-logrotate
```

### View Logs
```bash
pm2 logs academic-api
tail -f ~/logs/error.log
tail -f ~/logs/out.log
```

## Step 8: Backup Strategy

### Database Backups
```bash
#!/bin/bash
# backup-db.sh
BACKUP_DIR="/home/academic-api/backups"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)

mysqldump -u academic_user -p$DB_PASSWORD academic_db | gzip > $BACKUP_DIR/academic_db_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "academic_db_*.sql.gz" -mtime +7 -delete
```

### Add to Crontab
```bash
crontab -e
```

Add:
```
0 2 * * * /home/academic-api/backup-db.sh
```

## Step 9: Security Hardening

### Firewall Rules
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Update Regularly
```bash
sudo apt update && sudo apt upgrade -y
```

### Monitor Security
```bash
sudo apt install -y fail2ban
sudo systemctl start fail2ban
```

## Step 10: Database Optimization

### Create Indexes (if not created)
```sql
USE academic_db;

-- Already created in schema.ts, verify with:
SHOW INDEXES FROM users;
SHOW INDEXES FROM students;
SHOW INDEXES FROM teachers;
```

### Monitor Database
```bash
mysql -u academic_user -p academic_db -e "SHOW PROCESSLIST;"
```

## Performance Tuning

### MySQL Optimization
Edit `/etc/mysql/mysql.conf.d/mysqld.cnf`:

```ini
# Connection pool
max_connections = 1000
max_allowed_packet = 256M

# InnoDB
innodb_buffer_pool_size = 50% of available RAM
innodb_log_file_size = 512M
```

### Node.js Cluster Mode (Optional)
```typescript
import cluster from 'cluster';
import os from 'os';

if (cluster.isMaster) {
  const numCPUs = os.cpus().length;
  
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  app.listen(port);
}
```

## Monitoring Checklist

- [ ] Application running (pm2 status)
- [ ] Database connectivity
- [ ] SSL certificate valid
- [ ] Nginx responding
- [ ] Logs being written
- [ ] Backup completed
- [ ] No disk space issues (df -h)
- [ ] No memory leaks (pm2 monit)

## Troubleshooting

### Application won't start
```bash
pm2 logs academic-api
npm run build
pm2 start dist/server.js --name "academic-api"
```

### Database connection error
```bash
mysql -u academic_user -p academic_db -e "SELECT 1;"
# Check .env DATABASE settings
```

### High CPU/Memory usage
```bash
pm2 monit
pm2 kill
pm2 start dist/server.js --name "academic-api"
```

### SSL certificate issues
```bash
sudo certbot renew --force-renewal
sudo systemctl restart nginx
```

## Rollback Procedure

```bash
cd /home/academic-api
git log --oneline  # Find previous version
git revert <commit-hash>
npm run build
pm2 restart academic-api
```

## Health Check Endpoint

Monitor with cron:
```bash
*/5 * * * * curl -f http://localhost:5000/health || pm2 restart academic-api
```

## CI/CD Pipeline (Optional)

Use GitHub Actions for automated deployments:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm test
      - name: Deploy
        run: |
          ssh user@server 'cd /path && git pull && npm ci && npm run build && pm2 restart app'
```

## Production Checklist

- [ ] Environment variables configured
- [ ] Database backups scheduled
- [ ] SSL certificate installed
- [ ] Firewall rules configured
- [ ] PM2 auto-restart enabled
- [ ] Log rotation configured
- [ ] Monitoring alerts set up
- [ ] API tested and working
- [ ] CORS origin configured correctly
- [ ] Rate limiting considered
- [ ] Error tracking (Sentry/Similar) implemented
- [ ] Performance monitoring enabled

## Support and Monitoring

### Error Tracking (Recommended)
```bash
npm install @sentry/node
```

### Application Performance Monitoring
- Datadog
- New Relic
- AWS CloudWatch
- Prometheus + Grafana

## Scaling in Future

- Multi-server setup with load balancing
- Database read replicas
- Redis for caching
- Separate services for modules
- Kubernetes deployment

---

**Last Updated**: December 9, 2025
**Status**: Ready for Production
