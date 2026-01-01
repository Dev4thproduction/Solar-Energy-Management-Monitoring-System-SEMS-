# 🚀 Quick Start Guide - Unified Energy Management System

## Start the Server

```bash
cd Inverter_Details/server
npm start
```

Server URL: **http://localhost:5003**

---

## Test It's Working

```bash
curl http://localhost:5003/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2025-12-31T...",
  "modules": ["inverter", "weather", "meter", "solar"]
}
```

---

## API Endpoints Quick Reference

### Inverter
- `GET /api/inverter/records` - List records
- `POST /api/inverter/records/upload` - Upload Excel

### Weather
- `GET /api/weather` - List weather data
- `POST /api/weather/upload` - Upload Excel

### Meter
- `GET /api/meter` - List meter readings
- `POST /api/meter/upload` - Upload Excel

### Solar
- `GET /api/solar/sites` - List solar sites
- `GET /api/solar/daily-generation` - Daily power data
- `GET /api/solar/alerts` - System alerts
- `POST /api/solar/users/login` - User login

---

## Database Info

- **Name**: `unified_energy_management`
- **Type**: MongoDB Atlas
- **Collections**: 9 (inverter, weather, meter, sites, generations, alerts, users)

---

## Verify Database Connection

```bash
cd Inverter_Details/server
node src/test-connection.js
```

---

## Key Files

- **Server**: `Inverter_Details/server/src/server.js`
- **Models**: `Inverter_Details/server/src/models/`
- **Routes**: `Inverter_Details/server/src/routes/`
- **Config**: `Inverter_Details/server/.env`

---

## Common Commands

```bash
# Start server
npm start

# Development mode (auto-reload)
npm run dev

# Test connection
node src/test-connection.js

# Install dependencies
npm install
```

---

## Documentation

See these files for complete details:
- [UNIFIED_DATABASE_SETUP.md](UNIFIED_DATABASE_SETUP.md) - Complete guide
- [CONSOLIDATION_SUMMARY.md](CONSOLIDATION_SUMMARY.md) - What changed
- [../FINAL_STATUS.md](../FINAL_STATUS.md) - Final status

---

**All modules use ONE database**: `unified_energy_management`
