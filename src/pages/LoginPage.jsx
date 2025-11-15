import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
    User, Mail, Lock, Key, ArrowLeft, LogIn, Shield, Eye, EyeOff,
    Sparkles, AlertCircle, CheckCircle, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LoginPage = ({ collaborator = false }) => {
    const { isDarkMode } = useTheme();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        accessCode: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState('');
    
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            let role = 'visitor';
            
            // Determine user role
            if (collaborator && formData.accessCode === 'COLLAB2024') {
                role = 'collaborator';
            } else if (collaborator) {
                setError('Invalid collaboration access code');
                setLoading(false);
                return;
            }

            // Attempt login via backend API
            const result = await login(formData, role);
            
            if (result.success) {
                if (result.role === 'owner' || result.role === 'collaborator') {
                    navigate('/dashboard');
                } else {
                    navigate('/');
                }
            } else {
                setError(result.error || 'Login failed. Please check your credentials.');
            }
        } catch (err) {
            setError(err.message || 'An error occurred during login. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                {/* Back Button */}
                <Link 
                    to="/"
                    className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Back to Home
                </Link>

                {/* Login Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                    className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20"
                >
                    {/* Header */}
                    <div className="text-center mb-8">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="inline-block mb-4"
                        >
                            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                                <Shield size={40} className="text-white" />
                            </div>
                        </motion.div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Welcome Back
                        </h1>
                        <p className="text-gray-300">
                            {collaborator ? 'Enter your collaboration credentials' : 'Sign in to your account'}
                        </p>
                    </div>

                    {/* Error Message */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-3"
                            >
                                <AlertCircle size={20} className="text-red-400" />
                                <span className="text-red-300 text-sm">{error}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name Field */}
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <User size={20} />
                            </div>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                onFocus={() => setFocusedField('name')}
                                onBlur={() => setFocusedField('')}
                                required
                                placeholder="Enter your full name"
                                className={`w-full pl-12 pr-4 py-4 bg-white/5 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                                    focusedField === 'name' ? 'bg-white/10' : ''
                                } ${error && formData.name === '' ? 'border-red-500/50' : 'border-white/20'}`}
                            />
                        </div>

                        {/* Email Field */}
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <Mail size={20} />
                            </div>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField('')}
                                required
                                placeholder="Enter your email"
                                className={`w-full pl-12 pr-4 py-4 bg-white/5 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                                    focusedField === 'email' ? 'bg-white/10' : ''
                                } ${error && formData.email === '' ? 'border-red-500/50' : 'border-white/20'}`}
                            />
                        </div>

                        {/* Password Field */}
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <Lock size={20} />
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField('')}
                                required
                                placeholder="Enter your password"
                                className={`w-full pl-12 pr-12 py-4 bg-white/5 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                                    focusedField === 'password' ? 'bg-white/10' : ''
                                } ${error && formData.password === '' ? 'border-red-500/50' : 'border-white/20'}`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        {/* Access Code (Collaborator Only) */}
                        {collaborator && (
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                    <Key size={20} />
                                </div>
                                <input
                                    type="text"
                                    name="accessCode"
                                    value={formData.accessCode}
                                    onChange={handleChange}
                                    onFocus={() => setFocusedField('accessCode')}
                                    onBlur={() => setFocusedField('')}
                                    placeholder="Enter collaboration access code"
                                    className={`w-full pl-12 pr-4 py-4 bg-white/5 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                                        focusedField === 'accessCode' ? 'bg-white/10' : ''
                                    } ${error && formData.accessCode === '' ? 'border-red-500/50' : 'border-white/20'}`}
                                />
                            </div>
                        )}

                        {/* Submit Button */}
                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <LogIn size={20} />
                                    Sign In
                                </>
                            )}
                        </motion.button>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 text-center">
                        <p className="text-gray-400 text-sm">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-purple-400 hover:text-purple-300 transition-colors">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
