import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../index.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';

const MONTHS = [
    { value: '', label: 'All Months' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
];

function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [sites, setSites] = useState([]);
    const [years, setYears] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({ total: 0, 'Draft': 0, 'Site Publish': 0, 'Send to HQ Approval': 0, 'HQ Approved': 0 });

    // Helper function to get auth headers
    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    };

    // Filter states
    const [selectedSite, setSelectedSite] = useState('all');
    const [filterType, setFilterType] = useState('standard'); // 'standard' or 'custom'
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Checkbox selection state
    const [selectedRecords, setSelectedRecords] = useState([]);

    // Load user from localStorage
    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    // Logout function
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    // Fetch dropdown options
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const headers = getAuthHeaders();
                const [sitesRes, yearsRes] = await Promise.all([
                    fetch(`${API_URL}/sites`, { headers }),
                    fetch(`${API_URL}/years`, { headers }),
                ]);

                const sitesData = await sitesRes.json();
                const yearsData = await yearsRes.json();

                setSites(sitesData);
                setYears(yearsData);
            } catch (err) {
                console.error('Error fetching options:', err);
            }
        };

        fetchOptions();
    }, []);

    // Fetch submissions with filters
    const fetchSubmissions = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();

            if (selectedSite && selectedSite !== 'all') params.append('site', selectedSite);

            if (filterType === 'custom') {
                if (startDate) params.append('startDate', startDate);
                if (endDate) params.append('endDate', endDate);
            } else {
                if (selectedMonth) params.append('month', selectedMonth);
                if (selectedYear) params.append('year', selectedYear);
            }

            const headers = getAuthHeaders();
            const response = await fetch(`${API_URL}/submissions?${params.toString()}`, { headers });
            const data = await response.json();

            setSubmissions(data.submissions || []);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching submissions:', err);
            setError('Failed to load data. Make sure the backend is running.');
            setLoading(false);
        }
    }, [selectedSite, selectedMonth, selectedYear, filterType, startDate, endDate]);

    // Fetch stats
    const fetchStats = useCallback(async () => {
        try {
            const headers = getAuthHeaders();
            const response = await fetch(`${API_URL}/stats`, { headers });
            const data = await response.json();
            setStats(data);
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    }, []);

    useEffect(() => {
        fetchSubmissions();
        fetchStats();
    }, [fetchSubmissions, fetchStats]);

    // Handle status actions based on role
    const handleStatusAction = async (submissionId, action) => {
        try {
            const headers = getAuthHeaders();
            const response = await fetch(`${API_URL}/submissions/${submissionId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                    status: 'updating', // Will be set by backend based on action
                    action
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update status');
            }

            // Refresh data
            await fetchSubmissions();
            await fetchStats();

            alert(`✅ Status updated successfully!`);
        } catch (err) {
            setError(err.message || 'Failed to update status');
            alert(`❌ ${err.message}`);
        }
    };

    // Handle checkbox selection
    const handleSelectRecord = (recordId) => {
        setSelectedRecords(prev => {
            if (prev.includes(recordId)) {
                return prev.filter(id => id !== recordId);
            } else {
                return [...prev, recordId];
            }
        });
    };

    // Handle select all checkbox
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedRecords(submissions.map(sub => sub._id));
        } else {
            setSelectedRecords([]);
        }
    };

    // Submit selected records - dynamically determine action based on each record's status
    const handleSubmitSelected = async () => {
        if (selectedRecords.length === 0) {
            alert('Please select at least one record to submit');
            return;
        }

        const role = user?.role;

        // Get the selected submission objects
        const selectedSubmissions = submissions.filter(sub => selectedRecords.includes(sub._id));

        // Determine action for each record based on its current status and user role
        const recordsToProcess = selectedSubmissions.map(sub => {
            let action = '';

            if (role === 'user') {
                // Users: Draft → Site Publish
                if (sub.status === 'Draft') {
                    action = 'submit';
                }
            } else if (role === 'admin') {
                // Admins: Site Publish → Send to HQ Approval, or Site Hold
                if (sub.status === 'Site Publish') {
                    action = 'submit';
                } else if (sub.status === 'Send to HQ Approval') {
                    action = null; // Can't modify - locked
                }
            } else if (role === 'superadmin') {
                // Superadmins: Send to HQ Approval → HQ Approved
                if (sub.status === 'Send to HQ Approval') {
                    action = 'approve';
                } else if (sub.status === 'HQ Approved') {
                    action = null; // Already approved - locked
                }
            }

            return {
                id: sub._id,
                currentStatus: sub.status,
                action
            };
        });

        // Filter out records that can't be processed
        const processableRecords = recordsToProcess.filter(r => r.action !== null);

        if (processableRecords.length === 0) {
            alert('None of the selected records can be processed in their current status');
            return;
        }

        // Show what will happen
        const statusSummary = processableRecords.reduce((acc, r) => {
            acc[r.currentStatus] = (acc[r.currentStatus] || 0) + 1;
            return acc;
        }, {});

        const summaryText = Object.entries(statusSummary)
            .map(([status, count]) => `${count} ${status}`)
            .join(', ');

        const confirmMessage = `Are you sure you want to process ${processableRecords.length} record(s)?\n\n${summaryText}`;

        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            setLoading(true);
            const headers = getAuthHeaders();

            // Submit each record with its appropriate action
            const promises = processableRecords.map(record =>
                fetch(`${API_URL}/submissions/${record.id}`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify({
                        status: 'updating',
                        action: record.action
                    }),
                })
            );

            const results = await Promise.all(promises);

            // Check for failures
            const failures = results.filter(r => !r.ok);

            if (failures.length > 0) {
                throw new Error(`Failed to process ${failures.length} record(s)`);
            }

            // Clear selection and refresh data
            setSelectedRecords([]);
            await fetchSubmissions();
            await fetchStats();

            setLoading(false);
            alert(`✅ Successfully processed ${processableRecords.length} record(s)!`);
        } catch (err) {
            console.error('Error processing selected:', err);
            setError(err.message || 'Failed to process selected records');
            setLoading(false);
            alert(`❌ ${err.message}`);
        }
    };

    // Submit all records based on user role
    const handleSubmitAll = async () => {
        if (submissions.length === 0) {
            alert('No records to submit');
            return;
        }

        const role = user?.role;
        let targetRecords = [];
        let action = '';
        let confirmMessage = '';

        if (role === 'user') {
            // Users submit Draft → Site Publish
            targetRecords = submissions.filter(sub => sub.status === 'Draft');
            action = 'submit';
            confirmMessage = `Are you sure you want to submit all ${targetRecords.length} Draft record(s)?`;
        } else if (role === 'admin') {
            // Admins send Site Publish → Send to HQ Approval
            targetRecords = submissions.filter(sub => sub.status === 'Site Publish');
            action = 'submit';
            confirmMessage = `Are you sure you want to send all ${targetRecords.length} record(s) to HQ?`;
        } else if (role === 'superadmin') {
            // Superadmins approve Send to HQ Approval → HQ Approved
            targetRecords = submissions.filter(sub => sub.status === 'Send to HQ Approval');
            action = 'approve';
            confirmMessage = `Are you sure you want to approve all ${targetRecords.length} record(s)?`;
        }

        if (targetRecords.length === 0) {
            alert('No records available to submit');
            return;
        }

        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            setLoading(true);
            const headers = getAuthHeaders();

            // Submit all records in parallel
            const promises = targetRecords.map(sub =>
                fetch(`${API_URL}/submissions/${sub._id}`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify({
                        status: 'updating',
                        action
                    }),
                })
            );

            const results = await Promise.all(promises);

            // Check for failures
            const failures = results.filter(r => !r.ok);

            if (failures.length > 0) {
                throw new Error(`Failed to process ${failures.length} record(s)`);
            }

            // Clear selection and refresh data
            setSelectedRecords([]);
            await fetchSubmissions();
            await fetchStats();

            setLoading(false);
            alert(`✅ Successfully processed ${targetRecords.length} record(s)!`);
        } catch (err) {
            console.error('Error processing all:', err);
            setError(err.message || 'Failed to process all records');
            setLoading(false);
            alert(`❌ ${err.message}`);
        }
    };

    // Recalculate invGen and abtExport from source data
    const recalculateValues = async (submission) => {
        try {
            setLoading(true);
            const headers = getAuthHeaders();
            const response = await fetch(`${API_URL}/calculate?site=${encodeURIComponent(submission.site)}&date=${submission.date}`, { headers });
            const data = await response.json();

            if (data.invGen !== undefined && data.abtExport !== undefined) {
                // Update the submission with calculated values
                await fetch(`${API_URL}/submissions/${submission._id}`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify({
                        invGen: data.invGen,
                        abtExport: data.abtExport
                    }),
                });

                // Update local state
                setSubmissions(prev =>
                    prev.map(sub => sub._id === submission._id
                        ? { ...sub, invGen: data.invGen, abtExport: data.abtExport }
                        : sub
                    )
                );
            }
            setLoading(false);
        } catch (err) {
            console.error('Error recalculating values:', err);
            setError('Failed to recalculate values');
            setLoading(false);
        }
    };

    // Recalculate ALL visible submissions at once (optimized - single API call)
    const recalculateAllValues = async () => {
        if (submissions.length === 0) {
            setError('No submissions to recalculate');
            return;
        }

        try {
            setLoading(true);

            // Use optimized bulk endpoint - single API call for all records
            const headers = getAuthHeaders();
            const response = await fetch(`${API_URL}/recalculate-all`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    submissionIds: submissions.map(s => s._id)
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to recalculate');
            }

            // Update local state with all new values
            setSubmissions(prev =>
                prev.map(sub => {
                    const result = data.results.find(r => r.id === sub._id);
                    return result ? { ...sub, invGen: result.invGen, abtExport: result.abtExport } : sub;
                })
            );

            setLoading(false);
            alert(`✅ Successfully recalculated ${data.count} record(s)!`);
        } catch (err) {
            console.error('Error recalculating all values:', err);
            setError('Failed to recalculate all values: ' + err.message);
            setLoading(false);
        }
    };

    // Sync submissions from Inverter Details data
    const syncFromInverter = async () => {
        try {
            setLoading(true);

            const headers = getAuthHeaders();
            const response = await fetch(`${API_URL}/sync-inverter`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    site: selectedSite !== 'all' ? selectedSite : undefined
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to sync');
            }

            // Refresh the data
            await fetchSubmissions();
            await fetchStats();

            setLoading(false);
            alert(`✅ ${data.message}`);
        } catch (err) {
            console.error('Error syncing from inverter:', err);
            setError('Failed to sync from inverter: ' + err.message);
            setLoading(false);
        }
    };

    // Get status badge class
    const getStatusClass = (status) => {
        switch (status) {
            case 'Draft':
                return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
            case 'Site Publish':
                return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'Send to HQ Approval':
                return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            case 'HQ Approved':
                return 'bg-green-500/20 text-green-400 border-green-500/30';
            default:
                return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
        }
    };

    // Get action buttons based on user role and submission status
    const getActionButtons = (submission) => {
        if (!user) return null;

        const { status, _id } = submission;
        const role = user.role;

        // User role actions
        if (role === 'user') {
            if (status === 'Draft') {
                return (
                    <button
                        onClick={() => handleStatusAction(_id, 'submit')}
                        className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-medium transition-colors"
                    >
                        📤 Submit
                    </button>
                );
            }
        }

        // Admin role actions
        if (role === 'admin') {
            if (status === 'Site Publish') {
                return (
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleStatusAction(_id, 'site-hold')}
                            className="px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30 rounded-lg text-xs font-medium transition-colors"
                        >
                            ⏸️ Site Hold
                        </button>
                        <button
                            onClick={() => handleStatusAction(_id, 'submit')}
                            className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-lg text-xs font-medium transition-colors"
                        >
                            ✅ Send to HQ
                        </button>
                    </div>
                );
            } else if (status === 'Send to HQ Approval') {
                return (
                    <span className="px-3 py-1 bg-slate-500/20 text-slate-400 border border-slate-500/30 rounded-lg text-xs font-medium">
                        🔒 Locked (Sent to HQ)
                    </span>
                );
            }
        }

        // Superadmin role actions
        if (role === 'superadmin') {
            if (status === 'Send to HQ Approval') {
                return (
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleStatusAction(_id, 'site-hold')}
                            className="px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30 rounded-lg text-xs font-medium transition-colors"
                        >
                            ⏸️ Site Hold
                        </button>
                        <button
                            onClick={() => handleStatusAction(_id, 'approve')}
                            className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-lg text-xs font-medium transition-colors"
                        >
                            ✅ HQ Approve
                        </button>
                    </div>
                );
            } else if (status === 'HQ Approved') {
                return (
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-xs font-medium">
                        ✅ HQ Approved (Final)
                    </span>
                );
            } else {
                return (
                    <button
                        onClick={() => handleStatusAction(_id, 'site-hold')}
                        className="px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30 rounded-lg text-xs font-medium transition-colors"
                    >
                        ⏸️ Site Hold
                    </button>
                );
            }
        }

        return null;
    };

    // Format date
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yyyy = date.getFullYear();
        return `${dd}-${mm}-${yyyy}`;
    };

    // Get user-friendly status display name
    const getStatusDisplayName = (status) => {
        // Return the actual status value without mapping
        return status;
    };

    // Get user-friendly role display name
    const getRoleDisplayName = (role) => {
        const roleMap = {
            'user': 'Site Publisher',
            'admin': 'Send to HQ Approval',
            'superadmin': 'HQ Approver'
        };
        return roleMap[role] || role;
    };

    // Current selection display
    const getCurrentSelection = () => {
        const parts = [];
        if (selectedSite && selectedSite !== 'all') parts.push(selectedSite);

        if (filterType === 'custom') {
            if (startDate) parts.push(`From: ${formatDate(startDate)}`);
            if (endDate) parts.push(`To: ${formatDate(endDate)}`);
        } else {
            if (selectedMonth) parts.push(MONTHS.find(m => m.value === selectedMonth)?.label);
            if (selectedYear) parts.push(selectedYear);
        }

        return parts.length > 0 ? parts.join(' • ') : 'All Data';
    };

    if (loading && submissions.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white text-lg">Loading submissions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
                                <span className="text-3xl">📋</span>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white">Final Submission</h1>
                                <p className="text-slate-400 text-sm">Solar power generation data management</p>
                            </div>
                        </div>

                        {/* User Info & Logout */}
                        {user && (
                            <div className="flex items-center gap-4">
                                {user.role === 'superadmin' && (
                                    <button
                                        onClick={() => navigate('/submitted-data')}
                                        className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors font-medium flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Submitted Data
                                    </button>
                                )}
                                <div className="text-right">
                                    <div className="text-white font-medium">{user.username}</div>
                                    <div className="text-slate-400 text-sm">{user.email}</div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    user.role === 'superadmin'
                                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                        : user.role === 'admin'
                                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                        : 'bg-green-500/20 text-green-400 border border-green-500/30'
                                }`}>
                                    {getRoleDisplayName(user.role)}
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors font-medium"
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="bg-slate-800/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-4">
                        <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Total</div>
                        <div className="text-2xl font-bold text-white">{stats.total}</div>
                    </div>
                    <div className="bg-gray-500/10 backdrop-blur-md rounded-xl border border-gray-500/30 p-4">
                        <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Draft</div>
                        <div className="text-2xl font-bold text-gray-400">{stats['Draft'] || 0}</div>
                    </div>
                    <div className="bg-blue-500/10 backdrop-blur-md rounded-xl border border-blue-500/30 p-4">
                        <div className="text-blue-400 text-xs uppercase tracking-wider mb-1">Site Publish</div>
                        <div className="text-2xl font-bold text-blue-400">{stats['Site Publish'] || 0}</div>
                    </div>
                    <div className="bg-amber-500/10 backdrop-blur-md rounded-xl border border-amber-500/30 p-4">
                        <div className="text-amber-400 text-xs uppercase tracking-wider mb-1">Send to HQ</div>
                        <div className="text-2xl font-bold text-amber-400">{stats['Send to HQ Approval'] || 0}</div>
                    </div>
                    <div className="bg-green-500/10 backdrop-blur-md rounded-xl border border-green-500/30 p-4">
                        <div className="text-green-400 text-xs uppercase tracking-wider mb-1">HQ Approved</div>
                        <div className="text-2xl font-bold text-green-400">{stats['HQ Approved'] || 0}</div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Left Side: Type Selector + Site */}
                        <div className="flex flex-wrap gap-4 items-end flex-1">
                            {/* Site Filter */}
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2">Select Site</label>
                                <select
                                    value={selectedSite}
                                    onChange={(e) => setSelectedSite(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                >
                                    <option value="all">All Sites</option>
                                    {sites.map(site => (
                                        <option key={site} value={site}>{site}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Date Filter Type */}
                            <div className="min-w-[150px]">
                                <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2">Filter Type</label>
                                <div className="flex bg-slate-700/50 p-1 rounded-lg border border-slate-600/50">
                                    <button
                                        onClick={() => setFilterType('standard')}
                                        className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-all ${filterType === 'standard' ? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        Month/Year
                                    </button>
                                    <button
                                        onClick={() => setFilterType('custom')}
                                        className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-all ${filterType === 'custom' ? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        Date Range
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Specific Date Inputs */}
                        <div className="flex flex-wrap gap-4 items-end flex-[1.5]">
                            {filterType === 'standard' ? (
                                <>
                                    {/* Month Filter */}
                                    <div className="flex-1 min-w-[160px]">
                                        <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2">Select Month</label>
                                        <select
                                            value={selectedMonth}
                                            onChange={(e) => setSelectedMonth(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                        >
                                            {MONTHS.map(month => (
                                                <option key={month.value} value={month.value}>{month.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Year Filter */}
                                    <div className="flex-1 min-w-[120px]">
                                        <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2">Select Year</label>
                                        <select
                                            value={selectedYear}
                                            onChange={(e) => setSelectedYear(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                        >
                                            <option value="">All Years</option>
                                            {years.map(year => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Start Date */}
                                    <div className="flex-1 min-w-[160px]">
                                        <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2">Start Date</label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors [color-scheme:dark]"
                                        />
                                    </div>

                                    {/* End Date */}
                                    <div className="flex-1 min-w-[160px]">
                                        <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2">End Date</label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors [color-scheme:dark]"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Current Selection */}
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2">Current Selection</label>
                                <div className="px-4 py-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                                    {getCurrentSelection()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                        {error}
                        <button onClick={() => setError(null)} className="ml-4 underline">Dismiss</button>
                    </div>
                )}

                {/* Data Table */}
                <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 overflow-hidden">
                    <div className="p-6 border-b border-slate-700/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white mb-1">Submission Records</h2>
                                <p className="text-slate-400 text-sm">
                                    Showing {submissions.length} records
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={syncFromInverter}
                                    disabled={loading}
                                    className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-green-500/25"
                                    title="Create submissions from Inverter Details data"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                    </svg>
                                    {loading ? 'Syncing...' : 'Sync from Inverter'}
                                </button>
                                {submissions.length > 0 && (
                                    <button
                                        onClick={recalculateAllValues}
                                        disabled={loading}
                                        className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-purple-500/25"
                                        title="Recalculate Inv Gen and ABT Export for all visible records"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        {loading ? 'Recalculating...' : 'Recalculate All'}
                                    </button>
                                )}
                                {user && submissions.length > 0 && (
                                    <>
                                        <button
                                            onClick={handleSubmitSelected}
                                            disabled={loading || selectedRecords.length === 0}
                                            className={`px-4 py-2 ${
                                                user.role === 'superadmin' ? 'bg-green-500 hover:bg-green-600 shadow-green-500/25' :
                                                user.role === 'admin' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/25' :
                                                'bg-blue-500 hover:bg-blue-600 shadow-blue-500/25'
                                            } disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg`}
                                            title={
                                                user.role === 'superadmin' ? 'Approve selected HQ records' :
                                                user.role === 'admin' ? 'Send selected to HQ' :
                                                'Submit selected Draft records'
                                            }
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                            </svg>
                                            {loading ? 'Processing...' :
                                                user.role === 'superadmin' ? `Approve Selected (${selectedRecords.length})` :
                                                user.role === 'admin' ? `Send Selected (${selectedRecords.length})` :
                                                `Submit Selected (${selectedRecords.length})`
                                            }
                                        </button>
                                        <button
                                            onClick={handleSubmitAll}
                                            disabled={loading}
                                            className={`px-4 py-2 ${
                                                user.role === 'superadmin' ? 'bg-green-500 hover:bg-green-600 shadow-green-500/25' :
                                                user.role === 'admin' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/25' :
                                                'bg-blue-500 hover:bg-blue-600 shadow-blue-500/25'
                                            } disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg`}
                                            title={
                                                user.role === 'superadmin' ? 'Approve all HQ records at once' :
                                                user.role === 'admin' ? 'Send all to HQ at once' :
                                                'Submit all Draft records at once'
                                            }
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {loading ? 'Processing...' :
                                                user.role === 'superadmin' ? 'Approve All' :
                                                user.role === 'admin' ? 'Send All to HQ' :
                                                'Submit All'
                                            }
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-700/30">
                                <tr>
                                    <th className="px-4 py-4 text-center text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                        <input
                                            type="checkbox"
                                            onChange={handleSelectAll}
                                            checked={selectedRecords.length === submissions.length && submissions.length > 0}
                                            className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                                            title="Select all records"
                                        />
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                        Site
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                        Inv Gen (kWh)
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                        ABT Export (kWh)
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                        POA (kWh/m²)
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/30">
                                {submissions.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                                            No submissions found for the selected filters.
                                        </td>
                                    </tr>
                                ) : (
                                    submissions.map((sub) => (
                                        <tr key={sub._id} className="hover:bg-slate-700/20 transition-colors">
                                            <td className="px-4 py-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRecords.includes(sub._id)}
                                                    onChange={() => handleSelectRecord(sub._id)}
                                                    className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-sm text-white font-medium">
                                                {formatDate(sub.date)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-300">
                                                {sub.site}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right font-mono text-cyan-400">
                                                {sub.invGen?.toLocaleString() || '0'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right font-mono text-green-400">
                                                {sub.abtExport?.toLocaleString() || '0'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right font-mono text-amber-400">
                                                {sub.poa?.toFixed(2) || '0.00'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getStatusClass(sub.status)}`}>
                                                    {getStatusDisplayName(sub.status)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {getActionButtons(sub)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 bg-slate-700/20 border-t border-slate-700/50">
                        <p className="text-slate-400 text-xs text-center">
                            ℹ️ Filter by site, month, year, or custom date range. Click "Recalculate" to fetch Inv Gen and ABT Export from source data (Inverter Details and WeatherMeter).
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
