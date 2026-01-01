# Inverter Details - Quick Start Guide

## 🚀 Getting Started in 3 Steps

### Step 1: Install Dependencies
```bash
cd Inverter_Details
npm install
```

### Step 2: Start the App
```bash
npm run dev
```

### Step 3: Open in Browser
Navigate to: **http://localhost:5175**

---

## ✨ Dynamic Features Overview

### 1. Upload Excel Files
- Drag and drop Excel files (.xlsx, .xls, .csv)
- Automatic parsing and data extraction
- Status automatically set to "draft" on upload

### 2. Dynamic Data Management
- **Add New Rows**: Click "Add Row" button to create new entries
- **Edit Data**: Click edit icon to modify any field inline
- **Delete Rows**: Click delete icon to remove entries
- **Update Status**: Use dropdown to change status (Draft/Active/Inactive/Maintenance)

### 3. Search & Filter
- **Search**: Type site name or date to filter records
- **Status Filter**: Filter by status using the dropdown
- Real-time filtering as you type

### 4. Export Data
- Click "Export" to download current data as Excel file
- Exported file includes all modifications
- File named with current date

### 5. Statistics Dashboard
- Live statistics cards showing:
  - Total records
  - Draft count
  - Active count
  - Inactive count
  - Maintenance count

### 6. Performance Color Coding
Values are automatically color-coded:
- 🟢 **Green**: > 90% (Excellent performance)
- 🟡 **Yellow**: 80-90% (Good performance)
- 🟠 **Orange**: 0-80% (Needs attention)
- 🔴 **Red**: 0 (Offline/Critical)

---

## 📊 Sample Data

Use the included `sample_inverter_data.csv` file to test:
1. Click "Choose Excel File"
2. Select `public/sample_inverter_data.csv`
3. See 8 sample records loaded automatically

---

## 🎯 Key Actions

### Adding a New Record
1. Click "Add Row" button
2. Click edit icon on the new row
3. Fill in Site Name, Date, and inverter values
4. Click save (checkmark icon)

### Editing Existing Data
1. Click edit icon (pencil) on any row
2. Modify values directly in the table
3. Click save icon (checkmark) when done

### Changing Status
1. Click status dropdown for any row
2. Select new status (Draft/Active/Inactive/Maintenance)
3. Color updates automatically

### Exporting Data
1. Make any modifications to the data
2. Click "Export" button
3. Excel file downloads with all changes

### Clearing All Data
1. Click "Clear All" button
2. Confirm the action
3. Upload a new file or add rows manually

---

## 🔧 Integration with File Explorer

### Access from Main Launcher
1. Start the main file explorer app:
   ```bash
   cd ..
   npm run dev
   ```

2. Open: http://localhost:5173

3. Click "Inverter Details" card (⚡ icon)

4. App loads in embedded view

### File Tree Navigation
- Inverter Details appears in the sidebar
- Browse source files in src/ folder
- Access sample data in public/ folder

---

## 💡 Tips & Best Practices

### Excel File Format
- First row should be headers
- Required columns: Site Name, Date
- Inverter columns: Name them "Inverter 1", "Inverter 2", etc.
- Values: Use numbers (e.g., 95.5 for 95.5%)

### Data Entry
- Always save edits before switching to another row
- Use consistent date formats (YYYY-MM-DD recommended)
- Status changes are saved automatically

### Search & Filter
- Search works on Site Name and Date fields
- Combine search + filter for precise results
- Clear search to see all records again

### Performance
- App handles hundreds of records smoothly
- Use search/filter for large datasets
- Export regularly to save changes

---

## 🐛 Troubleshooting

### Port Already in Use
If port 5175 is busy:
```bash
# Edit vite.config.js
# Change port: 5175 to another port like 5176
```

### File Upload Not Working
- Ensure file is .xlsx, .xls, or .csv format
- Check file is not corrupted
- Try the sample file first to verify functionality

### Data Not Saving
- Data is stored in browser memory (client-side only)
- Use Export button to save changes to file
- For persistent storage, integrate with backend API

### Colors Not Showing
- Ensure values are numbers, not text
- Check browser console for errors
- Refresh the page

---

## 🎨 Customization

### Changing Port
Edit `vite.config.js`:
```javascript
server: {
  port: 5176, // Change to desired port
}
```

### Modifying Colors
Edit `src/App.jsx` - look for:
- `getPerformanceClass()` - inverter value colors
- `getStatusClass()` - status badge colors

### Adding More Status Options
Edit `src/App.jsx` - add options to status dropdowns and update `getStatusClass()`

---

## 📝 Next Steps

1. ✅ Upload sample data and explore features
2. ✅ Try editing, adding, and deleting records
3. ✅ Test search and filter functionality
4. ✅ Export modified data
5. ✅ Access via File Explorer launcher
6. 🔄 Integrate with backend API (optional)
7. 🔄 Add user authentication (optional)
8. 🔄 Implement data persistence (optional)

---

## 📚 Additional Resources

- Full Documentation: See [README.md](README.md)
- Sample Data: `public/sample_inverter_data.csv`
- Source Code: `src/App.jsx`
- Configuration: `vite.config.js`

---

**Need Help?** Check the full README.md for detailed documentation and troubleshooting guide.
