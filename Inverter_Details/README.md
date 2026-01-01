# Inverter Details - Upload & Display System

## Overview
This feature allows users to upload Excel files containing inverter performance data and display it in a formatted table. The system automatically sets the status to "draft" upon upload and provides an interactive interface for managing inverter data.

## Features

### 1. Excel File Upload
- Supports multiple Excel formats: `.xlsx`, `.xls`, `.csv`
- Drag-and-drop friendly interface
- Real-time file parsing and validation
- Error handling for invalid file formats

### 2. Data Display Format
The uploaded data is displayed in a table with the following columns:
- **Site Name**: Name of the solar plant/site
- **Date**: Date of the data record
- **Status**: Current status (automatically set to "draft" after upload)
- **Inverter 1, Inverter 2, ..., Inverter N**: Performance data for each inverter

### 3. Status Management
- Automatically sets status to "draft" upon upload
- Editable status dropdown with options:
  - Draft (default)
  - Active
  - Inactive
  - Maintenance
- Color-coded status indicators for quick identification

### 4. Performance Color Coding
Inverter values are color-coded based on performance:
- **Green**: Performance > 90% (Excellent)
- **Yellow**: Performance 80-90% (Good)
- **Orange**: Performance 0-80% (Warning)
- **Red**: Performance = 0 (Critical/Offline)

## Files Included

### 1. InverterDetails.jsx
React component with full functionality:
- Excel file upload handling
- Data parsing using xlsx library
- Interactive table display
- Status management
- Responsive design with Tailwind CSS

### 2. index.html
Standalone HTML page for testing:
- CDN-based React and xlsx libraries
- Tailwind CSS for styling
- No build process required
- Can be opened directly in browser

### 3. sample_inverter_data.csv
Sample Excel file for testing with realistic data:
- 8 sample sites
- Various inverter performance values
- Different status types
- Ready to upload and test

## Installation & Setup

### Option 1: Run as Standalone App (Recommended)

1. Navigate to the Inverter_Details directory:
```bash
cd Inverter_Details
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. The app will be available at: `http://localhost:5175`

### Option 2: Access via File Explorer Launcher

1. Start the main file explorer:
```bash
cd .. # Go back to main directory
npm run dev
```

2. Open `http://localhost:5173` (or the port shown)

3. Click on "Inverter Details" in the app launcher sidebar

4. The Inverter Details app will load in an embedded iframe

### Option 3: Standalone HTML (No Build Required)

Simply open the `index.html` file in a web browser:
```bash
# On Windows
start index.html

# On Mac/Linux
open index.html
```

## Usage Instructions

### Step 1: Upload Excel File

1. Click the "Choose Excel File" button
2. Select an Excel file (`.xlsx`, `.xls`, or `.csv`)
3. The file will be automatically parsed and displayed

### Step 2: View Data

Once uploaded, you'll see:
- Total number of records
- Formatted table with all data
- Color-coded inverter performance values
- Draft status indicator

### Step 3: Manage Status

- Click on any status dropdown to change the status
- Available options:
  - Draft (amber badge)
  - Active (green badge)
  - Inactive (red badge)
  - Maintenance (blue badge)

### Step 4: Clear Data

Click the "Clear Data" button to remove all data and upload a new file.

## Excel File Format

### Required Columns

Your Excel file should have the following columns (case-insensitive):

| Column Name | Type | Description | Example |
|-------------|------|-------------|---------|
| Site Name | Text | Name of the site/plant | "Solar Plant A" |
| Date | Date/Text | Record date | "2024-01-15" |
| Status | Text | Optional (will be overridden to "draft") | "Active" |
| Inverter 1 | Number | Performance % for Inverter 1 | 95.5 |
| Inverter 2 | Number | Performance % for Inverter 2 | 92.3 |
| ... | Number | Additional inverters as needed | ... |

### Sample Data Format

```csv
Site Name,Date,Status,Inverter 1,Inverter 2,Inverter 3,Inverter 4,Inverter 5
Solar Plant A,2024-01-15,Active,95.5,92.3,89.7,94.1,96.2
Solar Plant B,2024-01-16,Active,88.4,91.2,93.5,87.6,90.8
```

## Technical Details

### Dependencies

- **React**: ^19.2.0
- **xlsx**: ^0.18.5
- **Tailwind CSS**: ^4.1.18

### Component Architecture

```
InverterDetails Component
├── State Management
│   ├── inverterData (array of objects)
│   ├── uploading (boolean)
│   └── error (string)
├── File Upload Handler
│   ├── FileReader API
│   ├── XLSX parsing
│   └── Data processing
├── Data Display
│   ├── Dynamic column detection
│   ├── Table rendering
│   └── Color coding logic
└── Status Management
    ├── Status dropdown
    └── Update handler
```

### Key Functions

1. **handleFileUpload(event)**
   - Reads the selected file
   - Parses Excel data using xlsx library
   - Sets status to "draft" for all records
   - Updates component state

2. **getInverterColumns()**
   - Dynamically detects inverter columns
   - Filters columns containing "inverter" or "inv"
   - Returns sorted array of column names

3. **updateStatus(index, newStatus)**
   - Updates status for a specific row
   - Triggers re-render with new status

4. **clearData()**
   - Resets all data
   - Clears errors
   - Returns to upload state

## Styling & Design

### Color Scheme

- **Background**: Dark gradient (slate-900 to slate-800)
- **Cards**: Glass-morphism effect with backdrop blur
- **Primary Accent**: Purple to Pink gradient
- **Status Colors**:
  - Draft: Amber (#fbbf24)
  - Active: Green (#10b981)
  - Inactive: Red (#ef4444)
  - Maintenance: Blue (#3b82f6)

### Responsive Design

- Mobile-friendly table with horizontal scrolling
- Adaptive padding and spacing
- Touch-friendly buttons and controls

## Testing

### Test with Sample File

1. Navigate to the Inverter_Details folder
2. Use the included `sample_inverter_data.csv` file
3. Upload and verify:
   - All 8 records are displayed
   - Status is set to "draft" for all rows
   - Color coding works correctly
   - Status dropdown is functional

### Manual Testing Checklist

- [ ] Upload .xlsx file
- [ ] Upload .xls file
- [ ] Upload .csv file
- [ ] Verify status is "draft" after upload
- [ ] Change status for multiple rows
- [ ] Verify color coding for different performance values
- [ ] Test "Clear Data" functionality
- [ ] Test with empty file (should show error)
- [ ] Test with invalid file format (should show error)

## Troubleshooting

### Issue: File not uploading

**Solution**:
- Ensure the file is in .xlsx, .xls, or .csv format
- Check that the file is not corrupted
- Verify file size is reasonable (< 5MB recommended)

### Issue: Columns not displaying correctly

**Solution**:
- Ensure column names match the expected format
- Check for typos in column headers
- Verify "Inverter" columns contain "inverter" or "inv" in the name

### Issue: Status not changing

**Solution**:
- Click directly on the dropdown
- Ensure you're not clicking outside the select element
- Check browser console for JavaScript errors

## Future Enhancements

Potential improvements for future versions:

1. **Backend Integration**
   - Save data to database
   - API endpoints for CRUD operations
   - User authentication

2. **Advanced Features**
   - Export to PDF/Excel
   - Filter and search functionality
   - Sorting by columns
   - Pagination for large datasets

3. **Analytics**
   - Performance charts and graphs
   - Trend analysis
   - Alerts for low performance

4. **Validation**
   - Required field validation
   - Data type validation
   - Custom validation rules

## Support

For issues or questions:
1. Check the console for error messages
2. Verify file format matches the expected structure
3. Try the sample file to ensure the system is working
4. Review this documentation

## License

This component is part of the File Explorer project and follows the same license terms.

---

**Created**: December 2024
**Version**: 1.0.0
**Last Updated**: December 30, 2024
