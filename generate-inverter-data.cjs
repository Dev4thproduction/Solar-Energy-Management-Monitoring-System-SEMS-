const XLSX = require('xlsx');

// Create data for 30 days of June 2025 - ALL with "draft" status
const data = [
  { 'Site Name': 'Site-A', 'Date': '01-06-2025', 'Status': 'draft', 'Inverter 1': 95.5, 'Inverter 2': 92.3, 'Inverter 3': 89.7, 'Inverter 4': 94.1, 'Inverter 5': 96.2 },
  { 'Site Name': 'Site-A', 'Date': '02-06-2025', 'Status': 'draft', 'Inverter 1': 88.4, 'Inverter 2': 91.2, 'Inverter 3': 93.5, 'Inverter 4': 87.6, 'Inverter 5': 90.8 },
  { 'Site Name': 'Site-A', 'Date': '03-06-2025', 'Status': 'draft', 'Inverter 1': 85.1, 'Inverter 2': 89.4, 'Inverter 3': 92.4, 'Inverter 4': 94.3, 'Inverter 5': 91.7 },
  { 'Site Name': 'Site-A', 'Date': '04-06-2025', 'Status': 'draft', 'Inverter 1': 93.8, 'Inverter 2': 95.2, 'Inverter 3': 91.4, 'Inverter 4': 89.6, 'Inverter 5': 92.9 },
  { 'Site Name': 'Site-A', 'Date': '05-06-2025', 'Status': 'draft', 'Inverter 1': 90.2, 'Inverter 2': 88.7, 'Inverter 3': 94.6, 'Inverter 4': 92.1, 'Inverter 5': 95.3 },
  { 'Site Name': 'Site-A', 'Date': '06-06-2025', 'Status': 'draft', 'Inverter 1': 87.9, 'Inverter 2': 93.4, 'Inverter 3': 90.8, 'Inverter 4': 91.5, 'Inverter 5': 88.2 },
  { 'Site Name': 'Site-A', 'Date': '07-06-2025', 'Status': 'draft', 'Inverter 1': 0, 'Inverter 2': 0, 'Inverter 3': 0, 'Inverter 4': 0, 'Inverter 5': 0 },
  { 'Site Name': 'Site-A', 'Date': '08-06-2025', 'Status': 'draft', 'Inverter 1': 94.7, 'Inverter 2': 92.8, 'Inverter 3': 95.1, 'Inverter 4': 93.2, 'Inverter 5': 89.4 },
  { 'Site Name': 'Site-A', 'Date': '09-06-2025', 'Status': 'draft', 'Inverter 1': 91.3, 'Inverter 2': 94.5, 'Inverter 3': 88.9, 'Inverter 4': 90.7, 'Inverter 5': 93.6 },
  { 'Site Name': 'Site-A', 'Date': '10-06-2025', 'Status': 'draft', 'Inverter 1': 89.6, 'Inverter 2': 91.8, 'Inverter 3': 94.2, 'Inverter 4': 88.4, 'Inverter 5': 92.1 },
  { 'Site Name': 'Site-A', 'Date': '11-06-2025', 'Status': 'draft', 'Inverter 1': 93.4, 'Inverter 2': 89.7, 'Inverter 3': 91.5, 'Inverter 4': 95.3, 'Inverter 5': 90.8 },
  { 'Site Name': 'Site-A', 'Date': '12-06-2025', 'Status': 'draft', 'Inverter 1': 88.2, 'Inverter 2': 92.6, 'Inverter 3': 90.4, 'Inverter 4': 91.9, 'Inverter 5': 94.7 },
  { 'Site Name': 'Site-A', 'Date': '13-06-2025', 'Status': 'draft', 'Inverter 1': 95.8, 'Inverter 2': 93.1, 'Inverter 3': 89.3, 'Inverter 4': 92.4, 'Inverter 5': 91.6 },
  { 'Site Name': 'Site-A', 'Date': '14-06-2025', 'Status': 'draft', 'Inverter 1': 90.5, 'Inverter 2': 88.9, 'Inverter 3': 93.7, 'Inverter 4': 94.8, 'Inverter 5': 89.2 },
  { 'Site Name': 'Site-A', 'Date': '15-06-2025', 'Status': 'draft', 'Inverter 1': 92.1, 'Inverter 2': 95.4, 'Inverter 3': 91.8, 'Inverter 4': 88.6, 'Inverter 5': 93.9 },
  { 'Site Name': 'Site-A', 'Date': '16-06-2025', 'Status': 'draft', 'Inverter 1': 89.7, 'Inverter 2': 91.3, 'Inverter 3': 94.5, 'Inverter 4': 90.2, 'Inverter 5': 92.8 },
  { 'Site Name': 'Site-A', 'Date': '17-06-2025', 'Status': 'draft', 'Inverter 1': 94.3, 'Inverter 2': 90.6, 'Inverter 3': 88.4, 'Inverter 4': 93.7, 'Inverter 5': 91.1 },
  { 'Site Name': 'Site-A', 'Date': '18-06-2025', 'Status': 'draft', 'Inverter 1': 91.9, 'Inverter 2': 93.8, 'Inverter 3': 90.1, 'Inverter 4': 89.5, 'Inverter 5': 94.6 },
  { 'Site Name': 'Site-A', 'Date': '19-06-2025', 'Status': 'draft', 'Inverter 1': 88.6, 'Inverter 2': 92.4, 'Inverter 3': 95.2, 'Inverter 4': 91.7, 'Inverter 5': 90.3 },
  { 'Site Name': 'Site-A', 'Date': '20-06-2025', 'Status': 'draft', 'Inverter 1': 93.5, 'Inverter 2': 89.8, 'Inverter 3': 91.6, 'Inverter 4': 94.9, 'Inverter 5': 88.7 },
  { 'Site Name': 'Site-A', 'Date': '21-06-2025', 'Status': 'draft', 'Inverter 1': 90.8, 'Inverter 2': 94.1, 'Inverter 3': 89.2, 'Inverter 4': 92.6, 'Inverter 5': 95.4 },
  { 'Site Name': 'Site-A', 'Date': '22-06-2025', 'Status': 'draft', 'Inverter 1': 92.7, 'Inverter 2': 91.5, 'Inverter 3': 93.9, 'Inverter 4': 88.3, 'Inverter 5': 90.6 },
  { 'Site Name': 'Site-A', 'Date': '23-06-2025', 'Status': 'draft', 'Inverter 1': 89.4, 'Inverter 2': 93.2, 'Inverter 3': 90.7, 'Inverter 4': 95.1, 'Inverter 5': 91.8 },
  { 'Site Name': 'Site-A', 'Date': '24-06-2025', 'Status': 'draft', 'Inverter 1': 95.6, 'Inverter 2': 88.9, 'Inverter 3': 92.3, 'Inverter 4': 90.4, 'Inverter 5': 93.7 },
  { 'Site Name': 'Site-A', 'Date': '25-06-2025', 'Status': 'draft', 'Inverter 1': 91.2, 'Inverter 2': 94.8, 'Inverter 3': 88.5, 'Inverter 4': 92.9, 'Inverter 5': 89.6 },
  { 'Site Name': 'Site-A', 'Date': '26-06-2025', 'Status': 'draft', 'Inverter 1': 90.3, 'Inverter 2': 92.1, 'Inverter 3': 94.4, 'Inverter 4': 89.7, 'Inverter 5': 91.5 },
  { 'Site Name': 'Site-A', 'Date': '27-06-2025', 'Status': 'draft', 'Inverter 1': 93.9, 'Inverter 2': 90.5, 'Inverter 3': 91.2, 'Inverter 4': 94.6, 'Inverter 5': 88.8 },
  { 'Site Name': 'Site-A', 'Date': '28-06-2025', 'Status': 'draft', 'Inverter 1': 89.1, 'Inverter 2': 93.6, 'Inverter 3': 90.9, 'Inverter 4': 92.3, 'Inverter 5': 95.2 },
  { 'Site Name': 'Site-A', 'Date': '29-06-2025', 'Status': 'draft', 'Inverter 1': 92.4, 'Inverter 2': 89.3, 'Inverter 3': 94.7, 'Inverter 4': 91.1, 'Inverter 5': 90.6 },
  { 'Site Name': 'Site-A', 'Date': '30-06-2025', 'Status': 'draft', 'Inverter 1': 94.8, 'Inverter 2': 92.5, 'Inverter 3': 89.6, 'Inverter 4': 93.3, 'Inverter 5': 91.9 }
];

// Create workbook and worksheet
const ws = XLSX.utils.json_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Inverter Data');

// Write to file
XLSX.writeFile(wb, 'Site-A_Inverter_June2025.xlsx');
console.log('✅ File created: Site-A_Inverter_June2025.xlsx');
console.log('📍 Location: ' + __dirname);
