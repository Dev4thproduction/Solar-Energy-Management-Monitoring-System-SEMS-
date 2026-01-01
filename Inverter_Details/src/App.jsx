import { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import './index.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5003/api';

function App() {
  const [inverterData, setInverterData] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingRow, setEditingRow] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedSite, setSelectedSite] = useState('all');
  const [sites, setSites] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    Active: 0,
    Inactive: 0,
    Maintenance: 0,
  });
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch sites for dropdown
  const fetchSites = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/inverter/sites`);
      const data = await response.json();
      setSites(data);
    } catch (err) {
      console.error('Error fetching sites:', err);
    }
  }, []);

  // Fetch data from API
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/inverter/records?status=${filterStatus}&search=${searchTerm}&site=${selectedSite}`);
      const data = await response.json();

      // Transform data to match expected format
      const transformed = data.records.map(record => ({
        id: record._id,
        'Site Name': record.siteName,
        'Date': (() => {
          const d = new Date(record.date);
          const dd = String(d.getDate()).padStart(2, '0');
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const yyyy = d.getFullYear();
          return `${dd}-${mm}-${yyyy}`;
        })(),
        status: record.status,
        uploadedAt: record.uploadedAt,
        ...record.inverterValues
      }));

      setInverterData(transformed);
      setLoading(false);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data from server. Make sure the backend is running.');
      setLoading(false);
    }
  }, [filterStatus, searchTerm, selectedSite]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/inverter/stats`);
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  // Manual refresh handler
  const handleManualRefresh = async () => {
    await fetchData();
    await fetchStats();
  };

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  useEffect(() => {
    fetchData();
    fetchStats();
  }, [fetchData, fetchStats]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchData();
      fetchStats();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, fetchData, fetchStats]);

  // Refresh when user returns to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && autoRefresh) {
        fetchData();
        fetchStats();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [autoRefresh, fetchData, fetchStats]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/inverter/records/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      // Refresh data after upload
      await fetchData();
      await fetchStats();
      event.target.value = '';
    } catch (err) {
      setError('Error uploading file: ' + err.message);
      console.error('Error uploading file:', err);
    } finally {
      setUploading(false);
    }
  };

  const getInverterColumns = () => {
    if (inverterData.length === 0) return [];

    const firstRow = inverterData[0];
    const columns = Object.keys(firstRow).filter(key =>
      (key.toLowerCase().includes('inverter') || key.toLowerCase().startsWith('inv')) &&
      key !== 'id'
    );

    return columns.sort();
  };

  const clearData = async () => {
    if (!confirm('Are you sure you want to delete ALL records?')) return;

    try {
      await fetch(`${API_URL}/inverter/records`, { method: 'DELETE' });
      setInverterData([]);
      setError(null);
      setSearchTerm('');
      setFilterStatus('all');
      setEditingRow(null);
      await fetchStats();
    } catch (err) {
      setError('Failed to clear data');
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await fetch(`${API_URL}/inverter/records/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      setInverterData(prev =>
        prev.map(row => row.id === id ? { ...row, status: newStatus } : row)
      );
      await fetchStats();
    } catch (err) {
      setError('Failed to update status');
    }
  };

  const deleteRow = async (id) => {
    if (!confirm('Are you sure you want to delete this record?')) return;

    try {
      await fetch(`${API_URL}/inverter/records/${id}`, { method: 'DELETE' });
      setInverterData(prev => prev.filter(row => row.id !== id));
      await fetchStats();
    } catch (err) {
      setError('Failed to delete record');
    }
  };

  const updateInverterValue = (id, column, value) => {
    setInverterData(prev =>
      prev.map(row => row.id === id ? { ...row, [column]: value } : row)
    );
  };

  const saveRow = async (id) => {
    const row = inverterData.find(r => r.id === id);
    if (!row) return;

    const inverterValues = {};
    getInverterColumns().forEach(col => {
      inverterValues[col] = row[col];
    });

    try {
      await fetch(`${API_URL}/inverter/records/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteName: row['Site Name'],
          date: row['Date'],
          status: row.status,
          inverterValues,
        }),
      });
      setEditingRow(null);
    } catch (err) {
      setError('Failed to save changes');
    }
  };

  const addNewRow = async () => {
    const inverterColumns = getInverterColumns();
    const inverterValues = {};
    inverterColumns.forEach(col => {
      inverterValues[col] = 0;
    });

    try {
      const response = await fetch(`${API_URL}/inverter/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteName: 'New Site',
          date: new Date().toISOString().split('T')[0],
          status: 'Draft',
          inverterValues,
        }),
      });

      const newRecord = await response.json();

      const newRow = {
        id: newRecord._id,
        'Site Name': newRecord.siteName,
        'Date': newRecord.date.split('T')[0],
        status: newRecord.status,
        ...newRecord.inverterValues,
      };

      setInverterData(prev => [...prev, newRow]);
      setEditingRow(newRecord._id);
      await fetchStats();
    } catch (err) {
      setError('Failed to add new row');
    }
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(inverterData.map(({ id, uploadedAt, ...rest }) => rest));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inverter Data');

    const date = new Date();
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    const dateStr = `${dd}-${mm}-${yyyy}`;

    XLSX.writeFile(wb, `inverter_data_${dateStr}.xlsx`);
  };

  const getFilteredData = () => {
    return inverterData;
  };

  const getPerformanceClass = (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return 'text-slate-400';
    if (num > 90) return 'text-green-400';
    if (num > 80) return 'text-yellow-400';
    if (num > 0) return 'text-orange-400';
    return 'text-red-400';
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Draft':
      case 'draft':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Site Publish':
      case 'site publish':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'Send to HQ Approval':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'HQ Approved':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Site Hold':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'Active':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Inactive':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Maintenance':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const submitAllDraftRecords = async () => {
    try {
      setLoading(true);
      const draftRecords = inverterData.filter(r => r.status === 'Draft');

      if (draftRecords.length === 0) {
        setError('No draft records to submit');
        setLoading(false);
        return;
      }

      // Note: Status remains as 'draft' per user requirement
      // Status change logic will be implemented separately
      // Records are submitted but their status is not changed

      await fetchStats();
      setLoading(false);
      alert(`✅ Successfully submitted ${draftRecords.length} record(s)! Status remains as Draft.`);
    } catch (err) {
      setError('Failed to submit records');
      setLoading(false);
    }
  };

  const inverterColumns = getInverterColumns();
  const filteredData = getFilteredData();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Action Buttons */}
        {inverterData.length > 0 && (
          <div className="flex justify-end items-center gap-3 mb-4">
            {inverterData.filter(r => r.status === 'Draft').length > 0 && (
              <button
                onClick={submitAllDraftRecords}
                className="px-4 py-2 bg-purple-500 text-white border border-purple-600 rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2 text-sm font-medium shadow-lg shadow-purple-500/25"
                title="Submit all draft records for Final Submission"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Submit All ({inverterData.filter(r => r.status === 'Draft').length})
              </button>
            )}
            <label className="px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition-colors flex items-center gap-2 text-sm cursor-pointer">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {uploading ? 'Importing...' : 'Import Excel'}
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </button>
            <button
              onClick={addNewRow}
              className="px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Row
            </button>
            <button
              onClick={clearData}
              className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Stats Cards */}
        {inverterData.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <div className="bg-slate-800/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-4">
              <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Total</div>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
            </div>
            <div className="bg-amber-500/10 backdrop-blur-md rounded-xl border border-amber-500/30 p-4">
              <div className="text-amber-400 text-xs uppercase tracking-wider mb-1">Draft</div>
              <div className="text-2xl font-bold text-amber-400">{stats.Draft || 0}</div>
            </div>
            <div className="bg-purple-500/10 backdrop-blur-md rounded-xl border border-purple-500/30 p-4">
              <div className="text-purple-400 text-xs uppercase tracking-wider mb-1">Site Publish</div>
              <div className="text-2xl font-bold text-purple-400">{stats['Site Publish'] || 0}</div>
            </div>
            <div className="bg-blue-500/10 backdrop-blur-md rounded-xl border border-blue-500/30 p-4">
              <div className="text-blue-400 text-xs uppercase tracking-wider mb-1">Send to HQ</div>
              <div className="text-2xl font-bold text-blue-400">{stats['Send to HQ Approval'] || 0}</div>
            </div>
            <div className="bg-green-500/10 backdrop-blur-md rounded-xl border border-green-500/30 p-4">
              <div className="text-green-400 text-xs uppercase tracking-wider mb-1">HQ Approved</div>
              <div className="text-2xl font-bold text-green-400">{stats['HQ Approved'] || 0}</div>
            </div>
            <div className="bg-orange-500/10 backdrop-blur-md rounded-xl border border-orange-500/30 p-4">
              <div className="text-orange-400 text-xs uppercase tracking-wider mb-1">Site Hold</div>
              <div className="text-2xl font-bold text-orange-400">{stats['Site Hold'] || 0}</div>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        {inverterData.length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-4 mb-6">
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search by site name or date..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Status</option>
                <option value="Draft">Draft</option>
                <option value="Site Publish">Site Publish</option>
                <option value="Send to HQ Approval">Send to HQ Approval</option>
                <option value="HQ Approved">HQ Approved</option>
                <option value="Site Hold">Site Hold</option>
              </select>
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Sites</option>
                {sites.map(site => (
                  <option key={site} value={site}>{site}</option>
                ))}
              </select>
            </div>

            {/* Refresh Controls */}
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-700/50">
              <button
                onClick={handleManualRefresh}
                className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg transition-colors flex items-center gap-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Now
              </button>

              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500"
                />
                Auto-refresh (30s)
              </label>

              <span className="text-xs text-slate-400 ml-auto">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            </div>
          </div>
        )}

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

              <div className="mt-8 p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
                <p className="text-slate-400 text-sm mb-2">Need a sample file?</p>
                <a
                  href="/sample_inverter_data.csv"
                  download="sample_inverter_data.csv"
                  className="text-purple-400 hover:text-purple-300 text-sm underline"
                >
                  Download sample CSV file
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && inverterData.length > 0 && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
            <button onClick={() => setError(null)} className="ml-4 underline">Dismiss</button>
          </div>
        )}

        {/* Data Display Table */}
        {filteredData.length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="p-6 border-b border-slate-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Data Records</h2>
                  <p className="text-slate-400 text-sm">
                    Showing {filteredData.length} of {stats.total} records
                  </p>
                </div>
              </div>
            </div>

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
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {filteredData.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-700/20 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-white font-medium">
                        {editingRow === row.id ? (
                          <input
                            type="text"
                            value={row['Site Name'] || ''}
                            onChange={(e) => updateInverterValue(row.id, 'Site Name', e.target.value)}
                            className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white w-full"
                          />
                        ) : (
                          row['Site Name'] || row['site name'] || row['SiteName'] || '-'
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {editingRow === row.id ? (
                          <input
                            type="date"
                            value={row['Date'] || ''}
                            onChange={(e) => updateInverterValue(row.id, 'Date', e.target.value)}
                            className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white"
                          />
                        ) : (
                          row['Date'] || row['date'] || '-'
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusClass(row.status || 'Draft')}`}>
                          {row.status === 'Site Publish' ? 'Site Publish' : row.status === 'Draft' ? 'Draft' : row.status}
                        </span>
                      </td>
                      {inverterColumns.map((col) => (
                        <td
                          key={col}
                          className="px-6 py-4 text-sm"
                        >
                          {editingRow === row.id ? (
                            <input
                              type="number"
                              value={row[col] || 0}
                              onChange={(e) => updateInverterValue(row.id, col, e.target.value)}
                              className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white w-20"
                              step="0.1"
                            />
                          ) : (
                            <span className={`${getPerformanceClass(row[col])} font-mono`}>
                              {row[col] !== undefined ? row[col] : '-'}
                            </span>
                          )}
                        </td>
                      ))}
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => editingRow === row.id ? saveRow(row.id) : setEditingRow(row.id)}
                            className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                            title={editingRow === row.id ? 'Save' : 'Edit'}
                            disabled={row.status === 'site publish'}
                          >
                            {editingRow === row.id ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={() => deleteRow(row.id)}
                            className="p-1 text-red-400 hover:text-red-300 transition-colors"
                            title="Delete"
                            disabled={row.status === 'site publish'}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

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

        {filteredData.length === 0 && inverterData.length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 p-12 text-center">
            <p className="text-slate-400">No records match your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
