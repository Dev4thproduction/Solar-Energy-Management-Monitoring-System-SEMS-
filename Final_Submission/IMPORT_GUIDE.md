# Excel Import Guide for Final Submission

## Quick Start

### 1. Install Dependencies

```bash
cd Final_Submission/server
npm install
```

This will install the new dependencies: `axios`, `multer`, and `xlsx`

### 2. Sample File

A sample CSV file is provided: `sample_final_submission.csv`

**Columns**:
- `Date` - Date in format YYYY-MM-DD (e.g., 2025-12-30)
- `Site` - Site name (e.g., "Alpha Solar Farm", "Beta Industrial Park")
- `POA (kWh/m²)` - Plane of Array irradiance value
- `Status` - Status (Draft, Submitted, Approved, Rejected)

**Note**: `Inv Gen (kWh)` and `ABT Export (kWh)` are NOT required in the CSV because they will be **auto-calculated** from source data!

## Import Methods

### Method 1: Using API Endpoint (Recommended)

#### With Auto-Calculation (Default)

The system will automatically fetch and calculate `invGen` and `abtExport` from:
- **Inverter Details** API (for Inv Gen)
- **WeatherMeter** API (for ABT Export)

**API Call**:
```bash
curl -X POST http://localhost:5003/api/submissions/upload \
  -F "file=@sample_final_submission.csv" \
  -F "autoCalculate=true"
```

**Using Postman**:
1. Method: `POST`
2. URL: `http://localhost:5003/api/submissions/upload`
3. Body → form-data
4. Add key `file` with type `File` → Select your CSV/Excel file
5. Add key `autoCalculate` with value `true`
6. Click Send

**Response**:
```json
{
  "message": "Successfully uploaded 25 submissions",
  "count": 25,
  "autoCalculated": true
}
```

#### Without Auto-Calculation

If you want to provide `invGen` and `abtExport` values manually in the Excel file:

**Excel Format**:
```csv
Date,Site,Inv Gen (kWh),ABT Export (kWh),POA (kWh/m²),Status
2025-12-30,Alpha Solar Farm,1250.5,1180.3,5.24,Draft
```

**API Call**:
```bash
curl -X POST http://localhost:5003/api/submissions/upload \
  -F "file=@sample_final_submission_with_values.csv" \
  -F "autoCalculate=false"
```

### Method 2: Using Frontend Upload Component (Future Enhancement)

You can add a file upload button to the Final Submission frontend:

```jsx
const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('autoCalculate', 'true');

    const response = await fetch(`${API_URL}/submissions/upload`, {
        method: 'POST',
        body: formData
    });

    const result = await response.json();
    console.log(result.message);
    fetchSubmissions(); // Refresh the list
};
```

## Supported File Formats

- ✅ CSV (.csv)
- ✅ Excel (.xlsx)
- ✅ Excel 97-2003 (.xls)

## Column Name Variations

The upload endpoint is flexible with column names. It accepts:

| Standard Column | Accepted Variations |
|----------------|---------------------|
| Date | `Date`, `date`, `DATE` |
| Site | `Site`, `site`, `SITE` |
| POA (kWh/m²) | `POA (kWh/m²)`, `POA`, `poa` |
| Status | `Status`, `status` |
| Inv Gen (kWh) | `Inv Gen (kWh)`, `invGen`, `InvGen` |
| ABT Export (kWh) | `ABT Export (kWh)`, `abtExport`, `AbtExport` |

## Auto-Calculation Logic

When `autoCalculate=true`:

### 1. Inverter Generation Calculation
```javascript
// For each row:
// 1. Fetch inverter data from Inverter Details API
GET http://localhost:5002/api/records?search=Alpha+Solar+Farm

// 2. Filter by exact site name and date
// 3. Sum all inverter values (Inverter 1, 2, 3, etc.)
// 4. Divide by 1000 to get kWh

invGen = (Inv1 + Inv2 + Inv3 + ...) / 1000
```

### 2. ABT Export Calculation
```javascript
// For each row:
// 1. Fetch meter data from WeatherMeter API
GET http://localhost:3000/meter?date=30-12-2025

// 2. Sum all activeEnergyExport values for the date
abtExport = sum(activeEnergyExport)
```

## Testing the Import

### Step 1: Start All Required Services

```bash
# Terminal 1 - Inverter Details API
cd Inverter_Details/server
npm start
# Should run on port 5002

# Terminal 2 - WeatherMeter API
cd WeatherMeterManagement/backend
npm run start:dev
# Should run on port 3000

# Terminal 3 - Final Submission API
cd Final_Submission/server
npm install  # First time only
npm start
# Should run on port 5003
```

### Step 2: Import the Sample File

**Using curl**:
```bash
cd Final_Submission

curl -X POST http://localhost:5003/api/submissions/upload \
  -F "file=@sample_final_submission.csv" \
  -F "autoCalculate=true"
```

**Using PowerShell**:
```powershell
$uri = "http://localhost:5003/api/submissions/upload"
$filePath = "sample_final_submission.csv"

$form = @{
    file = Get-Item -Path $filePath
    autoCalculate = "true"
}

Invoke-RestMethod -Uri $uri -Method Post -Form $form
```

### Step 3: Verify the Data

1. Open the Final Submission frontend: http://localhost:5176
2. You should see 25 new records imported
3. Check the `Inv Gen (kWh)` and `ABT Export (kWh)` columns
4. Click the "🔄 Recalculate" button on any row to recalculate values

## Troubleshooting

### Issue: "No file uploaded"
**Solution**: Make sure you're sending the file with key name `file` in the form-data

### Issue: "File is empty"
**Solution**: Check that your CSV/Excel file has data and proper headers

### Issue: invGen and abtExport are 0
**Possible causes**:
1. Inverter Details or WeatherMeter API is not running
2. No matching data exists for the site/date in the source systems
3. Site name doesn't exactly match (case-sensitive)

**Solution**:
- Verify all three services are running
- Check that data exists in Inverter Details for the same site name and date
- Check that meter data exists in WeatherMeter for the date

### Issue: "Failed to process file"
**Solution**: Check the server logs for detailed error messages

## Sample Data Files

### 1. Basic Import (Auto-Calculate)
File: `sample_final_submission.csv`
- Contains: Date, Site, POA, Status
- Inv Gen and ABT Export will be auto-calculated

### 2. Create Your Own

**Template**:
```csv
Date,Site,POA (kWh/m²),Status
2025-12-30,Alpha Solar Farm,7.92,Draft
2025-12-30,Beta Industrial Park,4.62,Draft
2025-12-30,Gamma Rooftop Array,5.73,Draft
2025-12-30,Delta Power Station,6.39,Draft
2025-12-30,Epsilon Commercial Center,5.24,Draft
```

**Site Names** (Must match exactly):
- Alpha Solar Farm
- Beta Industrial Park
- Gamma Rooftop Array
- Delta Power Station
- Epsilon Commercial Center

## Performance

- The upload endpoint processes calculations in **parallel** using `Promise.all()`
- For 25 records, typical processing time: **2-5 seconds**
- For 100 records, typical processing time: **5-15 seconds**

Each record makes 2 API calls (Inverter Details + WeatherMeter), so processing time depends on:
- Network latency
- Database query performance
- Number of records being imported

## Best Practices

1. **Test with small files first** - Import 5-10 records before bulk importing
2. **Verify source data exists** - Ensure Inverter Details and WeatherMeter have data for your dates
3. **Use exact site names** - Site names are case-sensitive
4. **Check date formats** - Use YYYY-MM-DD format for best compatibility
5. **Monitor server logs** - Check console output for any errors during import

## API Response Examples

### Success Response
```json
{
  "message": "Successfully uploaded 25 submissions",
  "count": 25,
  "autoCalculated": true
}
```

### Error Responses

**No file**:
```json
{
  "error": "No file uploaded"
}
```

**Empty file**:
```json
{
  "error": "File is empty"
}
```

**No valid records**:
```json
{
  "error": "No valid records found in file"
}
```

**Processing error**:
```json
{
  "error": "Failed to process file: [detailed error message]"
}
```

## Next Steps

After importing your data:
1. Navigate to http://localhost:5176 to view the Final Submission page
2. Verify the imported records
3. Use the "🔄 Recalculate" button to update any individual records
4. Change the Status dropdown as needed
5. Filter by site, date range, or month/year

## Support

If you encounter issues:
1. Check all three services are running (ports 5002, 3000, 5003)
2. Verify MongoDB is running
3. Check server console logs for errors
4. Ensure your Excel/CSV file follows the format in the sample file
