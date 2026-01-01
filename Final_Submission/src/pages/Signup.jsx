import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';

function Signup() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const validateEmail = (email) => {
        return /@(user|admin|superadmin)$/.test(email);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        if (!validateEmail(formData.email)) {
            setError('Email must end with @user, @admin, or @superadmin');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Signup failed');
            }

            // Store token and user info
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redirect to dashboard
            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getRoleBadge = () => {
        if (!formData.email) return null;

        let role = '';
        let color = '';

        if (formData.email.endsWith('@user')) {
            role = 'User';
            color = 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        } else if (formData.email.endsWith('@admin')) {
            role = 'Admin';
            color = 'bg-green-500/20 text-green-400 border-green-500/30';
        } else if (formData.email.endsWith('@superadmin')) {
            role = 'Super Admin';
            color = 'bg-purple-500/20 text-purple-400 border-purple-500/30';
        }

        if (!role) return null;

        return (
            <div className={`inline-flex items-center px-2 py-1 rounded border text-xs font-medium ${color}`}>
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                Role: {role}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-500/20 rounded-2xl mb-4">
                        <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
                    <p className="text-slate-400">Sign up for Final Submission</p>
                </div>

                {/* Signup Form */}
                <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Error Message */}
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Username Field */}
                        <div>
                            <label className="block text-slate-300 text-sm font-medium mb-2">
                                Username
                            </label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                                placeholder="Choose a username"
                            />
                        </div>

                        {/* Email Field */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-slate-300 text-sm font-medium">
                                    Email
                                </label>
                                {getRoleBadge()}
                            </div>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                                placeholder="yourname@user (or @admin, @superadmin)"
                            />
                            <p className="mt-1 text-xs text-slate-400">
                                Use @user, @admin, or @superadmin to set your role
                            </p>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label className="block text-slate-300 text-sm font-medium mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                minLength={6}
                                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                                placeholder="Create a password (min 6 characters)"
                            />
                        </div>

                        {/* Confirm Password Field */}
                        <div>
                            <label className="block text-slate-300 text-sm font-medium mb-2">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                                placeholder="Confirm your password"
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-4 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-500/50 text-white rounded-lg font-medium transition-colors shadow-lg shadow-cyan-500/25"
                        >
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>

                        {/* Login Link */}
                        <div className="text-center text-sm text-slate-400">
                            Already have an account?{' '}
                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                className="text-cyan-400 hover:text-cyan-300 font-medium"
                            >
                                Sign in
                            </button>
                        </div>
                    </form>
                </div>

                {/* Role Info */}
                <div className="mt-6 p-4 bg-slate-800/30 border border-slate-700/50 rounded-lg">
                    <p className="text-xs text-slate-400 mb-2 font-semibold text-slate-300">Role Permissions:</p>
                    <ul className="text-xs text-slate-400 space-y-1">
                        <li className="flex items-center">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                            <strong>Site Publisher (@user):</strong> View and create submissions
                        </li>
                        <li className="flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            <strong>Send to HQ Approval (@admin):</strong> Send submissions to HQ
                        </li>
                        <li className="flex items-center">
                            <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                            <strong>HQ Approver (@superadmin):</strong> Approve submissions at HQ
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default Signup;
