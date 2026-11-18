# Deployment & Production Operations — SchemaVault

**Target:** PostgreSQL & Supabase Schema Linter & Destructive Change Detector  
**Author:** Jatin Sharma ([https://jatinsh.netlify.app/](https://jatinsh.netlify.app/))

---

## 1. Container Deployment (Docker)

```bash
docker build -t schemavault:latest .
docker run -d -p 5050:5050 --name schemavault schemavault:latest
```

## 2. Process Manager (PM2)

```bash
npm install -g pm2
pm2 start dist/bin.js --name "schemavault" -- studio --port 5050
```

## 3. Systemd Service Unit

```ini
[Unit]
Description=SchemaVault Background Service
After=network.target

[Service]
Type=simple
User=node
WorkingDirectory=/opt/schemavault
ExecStart=/usr/bin/node dist/bin.js studio --port 5050
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```
