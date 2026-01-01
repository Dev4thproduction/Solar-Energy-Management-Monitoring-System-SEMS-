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

function SubmittedData() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [sites, setSites] = useState([]);
    const [years, setYears] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({ total: 0, 'HQ Approved': 0 });

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
    const [filterType, setFilterType] = useState('standard');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Load user from localStorage
    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);

            // Redirect if not superadmin
            if (parsedUser.role !== 'superadmin') {
                navigate('/');
            }
        }
    }, [navigate]);

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

    // Fetch submitted data (HQ Approved only)
    const fetchSubmissions = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();

            // Force status to HQ Approved
            params.append('status', 'HQ Approved');

            if (selectedSite && selectedSite !== 'all') params.append('site', selectedSite);

            if (filterType === 'custom') {
                if (startDate) params.append('startDate', startDate);
                if (endDate) params.append('endDate', endDate);
            } else {
                if (selectedMonth) params.append('month', selectedMonth);
                if (selectedYear) params.append('year', selectedYear);
            }

            const headers = getAuthHeaders();
            const response = await fetch(`${API_URL}/submissions?${params}`, { headers });

            if (!response.ok) {
                throw new Error('Failed to fetch submissions');
            }

            const data = await response.json();
            // Backend returns { submissions: [...], total, page, limit, totalPages }
            setSubmissions(Array.isArray(data.submissions) ? data.submissions : Array.isArray(data) ? data : []);
            setError(null);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching submissions:', err);
        } finally {
            setLoading(false);
        }
    }, [selectedSite, filterType, selectedMonth, selectedYear, startDate, endDate]);

    // Fetch stats
    const fetchStats = useCallback(async () => {
        try {
            const params = new URLSearchParams();

            // Force status to HQ Approved for stats
            params.append('status', 'HQ Approved');

            if (selectedSite && selectedSite !== 'all') params.append('site', selectedSite);

            if (filterType === 'custom') {
                if (startDate) params.append('startDate', startDate);
                if (endDate) params.append('endDate', endDate);
            } else {
                if (selectedMonth) params.append('month', selectedMonth);
                if (selectedYear) params.append('year', selectedYear);
            }

            const headers = getAuthHeaders();
            const response = await fetch(`${API_URL}/stats?${params}`, { headers });

            if (!response.ok) {
                throw new Error('Failed to fetch stats');
            }

            const data = await response.json();
            setStats(data);
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    }, [selectedSite, filterType, selectedMonth, selectedYear, startDate, endDate]);

    // Fetch data when filters change
    useEffect(() => {
        fetchSubmissions();
        fetchStats();
    }, [fetchSubmissions, fetchStats]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
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

    const handleFilterTypeChange = (type) => {
        setFilterType(type);
        if (type === 'standard') {
            setStartDate('');
            setEndDate('');
        } else {
            setSelectedMonth('');
            setSelectedYear('');
        }
    };

    const handleClearFilters = () => {
        setSelectedSite('all');
        setSelectedMonth('');
        setSelectedYear('');
        setStartDate('');
        setEndDate('');
    };

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Header */}
            <div className="bg-slate-800/50 backdrop-blur-md border-b border-slate-700/50 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center justify-center w-10 h-10 bg-purple-500/20 rounded-xl">
                                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">Submitted Data</h1>
                                <p className="text-xs text-slate-400">HQ Approved Records</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate('/')}
                                className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Back to Dashboard
                            </button>

                            <div className="flex items-center space-x-3 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                                <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">{user.username}</p>
                                    <p className="text-xs text-purple-400">{getRoleDisplayName(user.role)}</p>
                                </div>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors border border-red-500/30"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm font-medium">Total Approved</p>
                                <p className="text-3xl font-bold text-white mt-2">{stats.total}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-md rounded-2xl border border-green-500/30 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-300 text-sm font-medium">HQ Approved</p>
                                <p className="text-3xl font-bold text-white mt-2">{stats['HQ Approved'] || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-500/30 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-white">Filters</h2>
                        <button
                            onClick={handleClearFilters}
                            className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
                        >
                            Clear All
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Filter Type Toggle */}
                        <div className="flex items-center space-x-2 bg-slate-700/30 rounded-lg p-1">
                            <button
                                onClick={() => handleFilterTypeChange('standard')}
                                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    filterType === 'standard'
                                        ? 'bg-purple-500 text-white'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                Standard Filter
                            </button>
                            <button
                                onClick={() => handleFilterTypeChange('custom')}
                                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    filterType === 'custom'
                                        ? 'bg-purple-500 text-white'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                Custom Date Range
                            </button>
                        </div>

                        {/* Site Filter */}
                        <div>
                            <label className="block text-slate-300 text-sm font-medium mb-2">Site</label>
                            <select
                                value={selectedSite}
                                onChange={(e) => setSelectedSite(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                            >
                                <option value="all">All Sites</option>
                                {sites.map((site) => (
                                    <option key={site} value={site}>{site}</option>
                                ))}
                            </select>
                        </div>

                        {filterType === 'standard' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-300 text-sm font-medium mb-2">Month</label>
                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                                    >
                                        {MONTHS.map((month) => (
                                            <option key={month.value} value={month.value}>{month.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-slate-300 text-sm font-medium mb-2">Year</label>
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                                    >
                                        <option value="">All Years</option>
                                        {years.map((year) => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-300 text-sm font-medium mb-2">Start Date</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-300 text-sm font-medium mb-2">End Date</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Submissions Table */}
                <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-700/50">
                        <h2 className="text-lg font-semibold text-white">Approved Submissions</h2>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : error ? (
                        <div className="p-6 text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 bg-red-500/20 rounded-full mb-4">
                                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <p className="text-red-400">{error}</p>
                        </div>
                    ) : !Array.isArray(submissions) || submissions.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-700/50 rounded-full mb-4">
                                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <p className="text-slate-400 text-lg">No approved submissions found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-700/30">
                                    <tr>
                                        <th className="px-4 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Site</th>
                                        <th className="px-4 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Date</th>
                                        <th className="px-4 py-4 text-center text-xs font-semibold text-slate-300 uppercase tracking-wider">Inv Gen</th>
                                        <th className="px-4 py-4 text-center text-xs font-semibold text-slate-300 uppercase tracking-wider">ABT Export</th>
                                        <th className="px-4 py-4 text-center text-xs font-semibold text-slate-300 uppercase tracking-wider">POA</th>
                                        <th className="px-4 py-4 text-center text-xs font-semibold text-slate-300 uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-4 text-center text-xs font-semibold text-slate-300 uppercase tracking-wider">Updated</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/30">
                                    {submissions.map((sub) => (
                                        <tr key={sub._id} className="hover:bg-slate-700/20 transition-colors">
                                            <td className="px-4 py-4 text-sm text-white font-medium">{sub.site}</td>
                                            <td className="px-4 py-4 text-sm text-slate-300">{formatDate(sub.date)}</td>
                                            <td className="px-4 py-4 text-sm text-slate-300 text-center">{sub.invGen}</td>
                                            <td className="px-4 py-4 text-sm text-slate-300 text-center">{sub.abtExport}</td>
                                            <td className="px-4 py-4 text-sm text-slate-300 text-center">{sub.poa}</td>
                                            <td className="px-4 py-4 text-center">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                    {getStatusDisplayName(sub.status)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-slate-400 text-center">{formatDate(sub.updatedAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default SubmittedData;
