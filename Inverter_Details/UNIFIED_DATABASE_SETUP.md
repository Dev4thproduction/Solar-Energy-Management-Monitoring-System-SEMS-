# Unified Energy Management System - Database Consolidation

## Overview

This project has been successfully consolidated to use a **single MongoDB database** (`unified_energy_management`) for all modules:
- **Inverter Details**
- **Weather Management**
- **Meter Management**
- **Solar Power Generation**

## Architecture

### Database Configuration
- **Database Name**: `unified_energy_management`
- **Connection**: MongoDB Atlas (Cloud)
- **Port**: 5003
- **Single Connection**: All modules share one database connection

### Project Structure

```
Inverter_Details/
└── server/
    ├── src/
    │   ├── models/
    │   │   ├── index.js              # Central export for all models
    │   │   ├── InverterRecord.js     # Inverter data model
    │   │   ├── Weather.js            # Weather data model
    │   │   ├── Meter.js              # Meter readings model
    │   │   ├── Site.js               # Solar site model
    │   │   ├── BuildGeneration.js    # Build generation model
    │   │   ├── DailyGeneration.js    # Daily generation model
    │   │   ├── MonthlyGeneration.js  # Monthly generation model
    │   │   ├── Alert.js              # Alert model
    │   │   └── User.js               # User authentication model
    │   │
    │   ├── routes/
    │   │   ├── inverterRoutes.js     # /api/inverter endpoints
    │   │   ├── weatherRoutes.js      # /api/weather endpoints
    │   │   ├── meterRoutes.js        # /api/meter endpoints
    │   │   └── solarRoutes.js        # /api/solar endpoints
    │   │
    │   └── server.js                 # Main server with unified DB connection
    │
    ├── .env                          # Environment variables
    ├── package.json                  # Dependencies
    └── package-lock.json

```

## API Endpoints

### Base URL
`http://localhost:5003`

### Health Check
- **GET** `/health` - Check server status and available modules

### Inverter Module
- **GET** `/api/inverter/records` - Get all inverter records
- **GET** `/api/inverter/stats` - Get inverter statistics
- **POST** `/api/inverter/records` - Create new inverter record
- **POST** `/api/inverter/records/upload` - Bulk upload from Excel
- **PUT** `/api/inverter/records/:id` - Update inverter record
- **DELETE** `/api/inverter/records/:id` - Delete inverter record

### Weather Module
- **GET** `/api/weather` - Get all weather records
- **GET** `/api/weather/stats` - Get weather statistics
- **POST** `/api/weather` - Create new weather record
- **POST** `/api/weather/upload` - Bulk upload from Excel
- **PUT** `/api/weather/:id` - Update weather record
- **DELETE** `/api/weather/:id` - Delete weather record

### Meter Module
- **GET** `/api/meter` - Get all meter records
- **GET** `/api/meter/stats` - Get meter statistics
- **POST** `/api/meter` - Create new meter record
- **POST** `/api/meter/upload` - Bulk upload from Excel
- **PUT** `/api/meter/:id` - Update meter record
- **DELETE** `/api/meter/:id` - Delete meter record

### Solar Module
#### Sites
- **GET** `/api/solar/sites` - Get all sites
- **POST** `/api/solar/sites` - Create new site
- **PUT** `/api/solar/sites/:id` - Update site
- **DELETE** `/api/solar/sites/:id` - Delete site

#### Build Generation
- **GET** `/api/solar/build-generation` - Get build generation records
- **POST** `/api/solar/build-generation` - Create build generation record
- **PUT** `/api/solar/build-generation/:id` - Update build generation

#### Daily Generation
- **GET** `/api/solar/daily-generation` - Get daily generation records
- **POST** `/api/solar/daily-generation` - Create daily generation record
- **PUT** `/api/solar/daily-generation/:id` - Update daily generation

#### Monthly Generation
- **GET** `/api/solar/monthly-generation` - Get monthly generation records
- **POST** `/api/solar/monthly-generation` - Create monthly generation record
- **PUT** `/api/solar/monthly-generation/:id` - Update monthly generation

#### Alerts
- **GET** `/api/solar/alerts` - Get all alerts
- **POST** `/api/solar/alerts` - Create new alert
- **PUT** `/api/solar/alerts/:id` - Update alert

#### Users
- **GET** `/api/solar/users` - Get all users
- **POST** `/api/solar/users` - Create new user
- **POST** `/api/solar/users/login` - User login

## Database Models

### 1. InverterRecord
```javascript
{
  siteName: String,
  date: Date,
  status: String (draft, site publish, Active, Inactive, Maintenance),
  inverterValues: Map,
  uploadedAt: Date,
  updatedAt: Date
}
```

### 2. Weather
```javascript
{
  siteName: String,
  date: String,
  time: String,
  poa: Number (0-1500),
  ghi: Number (0-1500),
  albedoUp: Number,
  albedoDown: Number,
  moduleTemp: Number,
  ambientTemp: Number,
  windSpeed: Number,
  rainfall: Number,
  humidity: Number,
  status: String
}
```

### 3. Meter
```javascript
{
  date: String,
  time: String,
  plantStartTime: String,
  plantStopTime: String,
  total: String,
  activeEnergyImport: Number,
  activeEnergyExport: Number,
  reactiveEnergyImport: Number,
  reactiveEnergyExport: Number,
  voltage: Number,
  current: Number,
  frequency: Number,
  powerFactor: Number,
  status: String
}
```

### 4. Site
```javascript
{
  siteName: String,
  siteNumber: Number (unique),
  capacity: Number
}
```

### 5. DailyGeneration
```javascript
{
  site: ObjectId (ref: Site),
  date: Date,
  dailyGeneration: Number,
  status: String
}
```

### 6. MonthlyGeneration
```javascript
{
  site: ObjectId (ref: Site),
  year: Number,
  month: Number (0-11),
  totalGeneration: Number,
  targetGeneration: Number,
  performanceRatio: Number,
  peakGeneration: Number,
  avgDailyGeneration: Number,
  daysOperational: Number,
  notes: String,
  status: String
}
```

### 7. BuildGeneration
```javascript
{
  site: ObjectId (ref: Site),
  year: Number,
  apr, may, jun, jul, aug, sep, oct, nov, dec, jan, feb, mar: Number
}
```

### 8. Alert
```javascript
{
  site: ObjectId (ref: Site),
  severity: String (CRITICAL, WARNING, INFO),
  message: String,
  resolved: Boolean,
  type: String (PERFORMANCE, EQUIPMENT, COMMUNICATION)
}
```

### 9. User
```javascript
{
  username: String (unique),
  password: String (hashed),
  role: String (ADMIN, OPERATOR, VIEWER)
}
```

## Installation & Setup

### 1. Install Dependencies
```bash
cd Inverter_Details/server
npm install
```

### 2. Environment Configuration
The `.env` file is already configured with:
```env
PORT=5003
MONGO_URI=mongodb+srv://inverterOP:inverterOP@cluster0.pnxrna2.mongodb.net/unified_energy_management?retryWrites=true&w=majority&appName=Cluster0
```

For local development:
```env
MONGO_URI=mongodb://localhost:27017/unified_energy_management
```

### 3. Start the Server
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

### 4. Verify Connection
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

## Dependencies

```json
{
  "bcryptjs": "^2.4.3",      // Password hashing for User model
  "cors": "^2.8.5",          // Cross-origin resource sharing
  "dotenv": "^16.3.1",       // Environment variables
  "express": "^4.18.2",      // Web framework
  "mongoose": "^8.0.0",      // MongoDB ODM
  "multer": "^1.4.5-lts.1",  // File upload handling
  "xlsx": "^0.18.5"          // Excel file processing
}
```

## Migration from Separate Databases

### What Changed?
1. **Before**: Three separate projects with three different databases
   - `WeatherMeterManagement` → NestJS/TypeScript with separate DB
   - `SolarPowerMeter` → Express/JavaScript with separate DB
   - `Inverter_Details` → Express/JavaScript with separate DB

2. **After**: Single unified project with one database
   - All models in `Inverter_Details/server/src/models/`
   - All routes in `Inverter_Details/server/src/routes/`
   - Single MongoDB database: `unified_energy_management`

### Benefits
- ✅ Single database connection
- ✅ Unified data access
- ✅ Simplified deployment
- ✅ Consistent API structure
- ✅ Easier maintenance
- ✅ Shared authentication (User model)
- ✅ Cross-module queries possible
- ✅ Reduced infrastructure costs

## Key Features

1. **Unified Authentication**: Single User model for all modules
2. **File Upload Support**: Excel file upload for Inverter, Weather, and Meter data
3. **RESTful API**: Consistent endpoint structure across all modules
4. **MongoDB Atlas**: Cloud-hosted database with automatic scaling
5. **Status Management**: Draft/Published workflow for all records
6. **Site Management**: Centralized solar site tracking
7. **Alert System**: Real-time alerts for performance monitoring

## Testing

### Test Weather API
```bash
curl http://localhost:5003/api/weather
```

### Test Meter API
```bash
curl http://localhost:5003/api/meter
```

### Test Solar Sites
```bash
curl http://localhost:5003/api/solar/sites
```

### Test Inverter Records
```bash
curl http://localhost:5003/api/inverter/records
```

## Troubleshooting

### Port Already in Use
If you see `EADDRINUSE: address already in use :::5003`:
```bash
# Find process using port 5003
netstat -ano | findstr :5003

# Kill the process (Windows)
taskkill /PID <process_id> /F

# Or change the port in .env
PORT=5004
```

### Database Connection Issues
- Verify MongoDB Atlas credentials
- Check network connectivity
- Ensure IP is whitelisted in MongoDB Atlas
- For local MongoDB: Ensure MongoDB service is running

### Module Import Errors
- Run `npm install` to ensure all dependencies are installed
- Check that all model files exist in `src/models/`
- Verify `models/index.js` exports all models correctly

## Next Steps

1. **Update Frontend Applications**: Point all frontend apps to the unified API
2. **Data Migration**: If needed, migrate existing data from old databases
3. **API Documentation**: Consider adding Swagger/OpenAPI documentation
4. **Authentication**: Implement JWT tokens for secure API access
5. **Testing**: Add unit and integration tests
6. **Monitoring**: Set up logging and monitoring for the unified system

## Conclusion

The consolidation is complete! All models from Weather, Meter, Solar, and Inverter modules are now in a single MongoDB database with a unified API structure. The server is ready to use and can be started with `npm start` or `npm run dev`.
