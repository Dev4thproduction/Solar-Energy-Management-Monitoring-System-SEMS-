# Auto-Calculation Feature for Final Submission

## Overview

The Final Submission module now supports automatic calculation of **Inverter Generation (Inv Gen)** and **ABT Export** values from source data stored in other modules (Inverter Details and WeatherMeter Management).

## How It Works

### 1. Inverter Generation Calculation

**Source**: Inverter Details module (Port 5002)

**Formula**: `(Sum of all inverter values) / 1000`

**Process**:
- Fetches inverter records from the Inverter Details API for a specific site and date
- Sums all inverter values (Inverter 1, Inverter 2, Inverter 3, etc.) from the `inverterValues` field
- Divides the total by 1000 to convert to kWh
- Returns the calculated value

**Example**:
```javascript
Site: "Gamma Rooftop Array"
Date: "2025-12-29"
Inverter Values: {
  "Inverter 1": 83,
  "Inverter 2": 69,
  "Inverter 3": 89
}

Calculation: (83 + 69 + 89) / 1000 = 0.241 kWh
```

### 2. ABT Export Calculation

**Source**: WeatherMeter Management module (Port 3000)

**Formula**: `Sum of activeEnergyExport values for the date`

**Process**:
- Fetches meter data from the WeatherMeter API for a specific date
- Sums all `activeEnergyExport` values (net export @ GSS) for matching records
- Returns the total export value in kWh

**Example**:
```javascript
Date: "30-12-2025"
Meter Records: [
  { time: "06:00", activeEnergyExport: 150 },
  { time: "12:00", activeEnergyExport: 320 },
  { time: "18:00", activeEnergyExport: 180 }
]

Calculation: 150 + 320 + 180 = 650 kWh
```

## API Endpoints

### GET `/api/calculate`

Calculate invGen and abtExport for a specific site and date.

**Query Parameters**:
- `site` (required): Site name (e.g., "Alpha Solar Farm")
- `date` (required): Date in ISO format (e.g., "2025-12-30")

**Response**:
```json
{
  "site": "Alpha Solar Farm",
  "date": "2025-12-30",
  "invGen": 1.23,
  "abtExport": 650.00
}
```

**Example Request**:
```bash
GET http://localhost:5003/api/calculate?site=Alpha%20Solar%20Farm&date=2025-12-30
```

### POST `/api/submissions` (Enhanced)

Create a new submission with optional auto-calculation.

**Request Body**:
```json
{
  "site": "Alpha Solar Farm",
  "date": "2025-12-30",
  "poa": 5.24,
  "status": "Draft",
  "autoCalculate": true
}
```

**Parameters**:
- `autoCalculate` (optional, boolean): If `true`, automatically calculates `invGen` and `abtExport` from source data
- `invGen` (optional, number): Manual value (skipped if `autoCalculate` is `true`)
- `abtExport` (optional, number): Manual value (skipped if `autoCalculate` is `true`)

## Frontend Usage

### Recalculate Button

Each row in the Final Submission table now has a **"🔄 Recalculate"** button that:

1. Fetches the latest data from Inverter Details and WeatherMeter
2. Calculates invGen and abtExport
3. Updates the submission record with the new values
4. Refreshes the UI to display the updated values

### User Workflow

1. Navigate to the Final Submission page
2. Find the record you want to update
3. Click the **"🔄 Recalculate"** button in the Actions column
4. The system will:
   - Fetch data from Inverter Details (sum of all inverters / 1000)
   - Fetch data from WeatherMeter (sum of activeEnergyExport)
   - Update the Inv Gen and ABT Export columns automatically

## Configuration

### Environment Variables

Create a `.env` file in `Final_Submission/server/` directory:

```env
PORT=5003
MONGO_URI=mongodb://localhost:27017/final_submission
INVERTER_API_URL=http://localhost:5002/api
METER_API_URL=http://localhost:3000/meter
```

**Required Services**:
- Inverter Details API: `http://localhost:5002/api`
- WeatherMeter API: `http://localhost:3000/meter`

## Installation

1. Install dependencies:
```bash
cd Final_Submission/server
npm install
```

2. The new `axios` dependency has been added to `package.json`

3. Start the server:
```bash
npm start
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Final Submission Module                   │
│                     (Port 5003)                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Calculation Request
                            ▼
            ┌───────────────────────────────┐
            │   Calculate Endpoint          │
            │   GET /api/calculate          │
            └───────────────┬───────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
┌─────────────────────┐         ┌─────────────────────┐
│  Inverter Details   │         │  WeatherMeter       │
│  (Port 5002)        │         │  (Port 3000)        │
│                     │         │                     │
│ GET /api/records    │         │ GET /meter          │
│                     │         │                     │
│ Returns:            │         │ Returns:            │
│ - siteName          │         │ - date              │
│ - date              │         │ - activeEnergyExport│
│ - inverterValues    │         │                     │
│   (Map)             │         │                     │
└─────────────────────┘         └─────────────────────┘
            │                               │
            └───────────────┬───────────────┘
                            ▼
            ┌───────────────────────────────┐
            │   Calculate Function          │
            │                               │
            │ invGen = Σ(inverters) / 1000 │
            │ abtExport = Σ(export)        │
            └───────────────────────────────┘
```

## Error Handling

- If the Inverter Details API is unavailable, `invGen` defaults to `0`
- If the WeatherMeter API is unavailable, `abtExport` defaults to `0`
- Connection errors are logged to the console
- Users see the calculated values (or 0) in the UI

## Benefits

1. **Data Integrity**: Values are calculated from actual source data, not manually entered
2. **Automation**: Reduces manual data entry and calculation errors
3. **Real-time Updates**: Always fetches the latest data from source systems
4. **Transparency**: Users can see exactly how values are calculated
5. **Flexibility**: Manual override is still possible by editing the submission

## Notes

- The calculation is performed on-demand when the user clicks "Recalculate"
- Values are stored in the database after calculation
- Historical values are preserved unless explicitly recalculated
- The system requires all three services (Final Submission, Inverter Details, WeatherMeter) to be running for auto-calculation to work
