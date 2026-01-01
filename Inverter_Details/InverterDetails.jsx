import { useState } from 'react';
import * as XLSX from 'xlsx';

function InverterDetails() {
  const [inverterData, setInverterData] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Process the data and add status as "draft"
        const processedData = jsonData.map((row) => ({
          ...row,
          status: 'draft',
          uploadedAt: new Date().toISOString()
        }));

        setInverterData(processedData);
        setUploading(false);
      } catch (err) {
        setError('Error parsing Excel file. Please ensure it has the correct format.');
        setUploading(false);
        console.error('Error reading file:', err);
      }
    };

    reader.onerror = () => {
      setError('Error reading file. Please try again.');
      setUploading(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const getInverterColumns = () => {
    if (inverterData.length === 0) return [];

    const firstRow = inverterData[0];
    const columns = Object.keys(firstRow).filter(key =>
      key.toLowerCase().includes('inverter') ||
      key.toLowerCase().startsWith('inv')
    );

    return columns.sort();
  };

  const clearData = () => {
    setInverterData([]);
    setError(null);
  };

  const updateStatus = (index, newStatus) => {
    const updatedData = [...inverterData];
    updatedData[index].status = newStatus;
    setInverterData(updatedData);
  };

  const inverterColumns = getInverterColumns();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl">⚡</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Inverter Details</h1>
                <p className="text-slate-400 text-sm">Upload and view inverter performance data</p>
              </div>
            </div>

            {inverterData.length > 0 && (
              <button
                onClick={clearData}
                className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                Clear Data
              </button>
            )}
          </div>
        </div>

        {/* Upload Section */}
        {inverterData.length === 0 && (
          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border-2 border-dashed border-slate-700/50 p-12 mb-6 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">📊</span>
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">Upload Excel File</h2>
              <p className="text-slate-400 mb-6">
                Upload an Excel file (.xlsx, .xls, .csv) containing inverter data.
                <br />
                Expected columns: Site Name, Date, Status, Inverter 1, Inverter 2, etc.
              </p>

              <label className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl cursor-pointer hover:from-purple-600 hover:to-pink-700 transition-all duration-200 font-semibold">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {uploading ? 'Uploading...' : 'Choose Excel File'}
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>

              {error && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Sample File Link */}
              <div className="mt-8 p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
                <p className="text-slate-400 text-sm mb-2">Need a sample file?</p>
                <a
                  href="/Inverter_Details/sample_inverter_data.csv"
                  download="sample_inverter_data.csv"
                  className="text-purple-400 hover:text-purple-300 text-sm underline"
                >
                  Download sample CSV file
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Data Display Table */}
        {inverterData.length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 overflow-hidden">
            {/* Table Header Info */}
            <div className="p-6 border-b border-slate-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Uploaded Data</h2>
                  <p className="text-slate-400 text-sm">
                    {inverterData.length} records • Status automatically set to "draft"
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-sm font-medium">
                    Draft Mode
                  </div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/30">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Site Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Status
                    </th>
                    {inverterColumns.map((col) => (
                      <th
                        key={col}
                        className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {inverterData.map((row, index) => (
                    <tr
                      key={index}
                      className="hover:bg-slate-700/20 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-white font-medium">
                        {row['Site Name'] || row['site name'] || row['SiteName'] || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {row['Date'] || row['date'] || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={row.status}
                          onChange={(e) => updateStatus(index, e.target.value)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${
                            row.status === 'draft'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              : row.status === 'active' || row.status === 'Active'
                              ? 'bg-green-500/20 text-green-400 border-green-500/30'
                              : row.status === 'inactive' || row.status === 'Inactive'
                              ? 'bg-red-500/20 text-red-400 border-red-500/30'
                              : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                          }`}
                        >
                          <option value="draft">Draft</option>
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="Maintenance">Maintenance</option>
                        </select>
                      </td>
                      {inverterColumns.map((col) => (
                        <td
                          key={col}
                          className="px-6 py-4 text-sm text-slate-300"
                        >
                          <span className={`${
                            parseFloat(row[col]) > 90
                              ? 'text-green-400'
                              : parseFloat(row[col]) > 80
                              ? 'text-yellow-400'
                              : parseFloat(row[col]) > 0
                              ? 'text-orange-400'
                              : 'text-red-400'
                          } font-mono`}>
                            {row[col] !== undefined ? row[col] : '-'}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="p-4 bg-slate-700/20 border-t border-slate-700/50">
              <p className="text-slate-400 text-xs text-center">
                ℹ️ Color coding: <span className="text-green-400">Green (&gt;90)</span> •
                <span className="text-yellow-400"> Yellow (80-90)</span> •
                <span className="text-orange-400"> Orange (0-80)</span> •
                <span className="text-red-400"> Red (0)</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default InverterDetails;
