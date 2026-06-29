import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
    User, Mail, Lock, Eye, EyeOff,
    Sparkles, AlertCircle, CheckCircle, Loader2, Chrome
} from 'lucide-react';
import { motion } from 'framer-motion';
import '../styles/LoginPage.css';

const RegisterPage = () => {
    const { isDarkMode } = useTheme();
    const googleBtnRef = useRef(null);
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState('');
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [googleLoading, setGoogleLoading] = useState(false);

    const { register, googleSignIn } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (formData.password) {
            let strength = 0;
            if (formData.password.length > 6) strength++;
            if (formData.password.length > 10) strength++;
            if (/[a-z]/.test(formData.password) && /[A-Z]/.test(formData.password)) strength++;
            if (/\d/.test(formData.password)) strength++;
            if (/[^a-zA-Z\d]/.test(formData.password)) strength++;
            setPasswordStrength(Math.min(strength, 4));
        } else {
            setPasswordStrength(0);
        }
    }, [formData.password]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        try {
            const result = await register({
                name: formData.name,
                username: formData.username,
                email: formData.email,
                password: formData.password
            });

            if (result.success) {
                setSuccess('Account created! Redirecting to dashboard...');
                setTimeout(() => navigate('/dashboard'), 1500);
            } else {
                setError(result.error || 'Registration failed');
            }
        } catch (err) {
            setError(err.message || 'An error occurred during registration');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = () => {
        const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!googleClientId) {
            setError('Google sign-in is not configured. Please register with email instead.');
            return;
        }
        const redirectUri = `${window.location.origin}/auth/google/callback`;
        const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${redirectUri}&response_type=token id_token&scope=openid%20profile%20email&nonce=${Date.now()}`;
        window.location.href = url;
    };

    const inputClasses = (field) =>
        `w-full px-4 py-3 rounded-xl border bg-white/5 backdrop-blur-sm text-white placeholder-gray-400 transition-all duration-300 ${
            focusedField === field
                ? 'border-cyan-400/50 shadow-lg shadow-cyan-500/10'
                : 'border-white/10 hover:border-white/20'
        }`;

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
            <div className="absolute top-20 -left-20 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-20 -right-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative w-full max-w-md px-4"
            >
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/10">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 mb-4 shadow-lg">
                            <Sparkles className="text-white" size={28} />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Create Your Portfolio</h1>
                        <p className="text-gray-400 text-sm">Join e-Folio Pro and build your professional presence</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                <User size={14} className="inline mr-1" /> Full Name
                            </label>
                            <input
                                type="text" name="name" placeholder="John Doe" required
                                value={formData.name} onChange={handleChange}
                                onFocus={() => setFocusedField('name')}
                                onBlur={() => setFocusedField('')}
                                className={inputClasses('name')}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                <User size={14} className="inline mr-1" /> Username
                            </label>
                            <input
                                type="text" name="username" placeholder="johndoe" required
                                value={formData.username} onChange={handleChange}
                                onFocus={() => setFocusedField('username')}
                                onBlur={() => setFocusedField('')}
                                className={inputClasses('username')}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                <Mail size={14} className="inline mr-1" /> Email
                            </label>
                            <input
                                type="email" name="email" placeholder="you@example.com" required
                                value={formData.email} onChange={handleChange}
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField('')}
                                className={inputClasses('email')}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                <Lock size={14} className="inline mr-1" /> Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password" placeholder="At least 6 characters" required
                                    value={formData.password} onChange={handleChange}
                                    onFocus={() => setFocusedField('password')}
                                    onBlur={() => setFocusedField('')}
                                    className={inputClasses('password')}
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors">
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {formData.password && (
                                <div className="flex gap-1 mt-1.5">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                            i <= passwordStrength
                                                ? passwordStrength <= 2 ? 'bg-red-500' : passwordStrength === 3 ? 'bg-yellow-500' : 'bg-green-500'
                                                : 'bg-white/10'
                                        }`} />
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                <Lock size={14} className="inline mr-1" /> Confirm Password
                            </label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="confirmPassword" placeholder="Repeat password" required
                                value={formData.confirmPassword} onChange={handleChange}
                                onFocus={() => setFocusedField('confirmPassword')}
                                onBlur={() => setFocusedField('')}
                                className={inputClasses('confirmPassword')}
                            />
                        </div>

                        {error && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                                <AlertCircle size={16} /> {error}
                            </motion.div>
                        )}

                        {success && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
                                <CheckCircle size={16} /> {success}
                            </motion.div>
                        )}

                        <button type="submit" disabled={loading}
                            className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl font-medium
                                hover:from-cyan-400 hover:to-purple-400 transition-all duration-300 shadow-lg shadow-cyan-500/20
                                disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group">
                            {loading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <><Sparkles size={18} className="group-hover:rotate-12 transition-transform" /> Create Account</>
                            )}
                        </button>
                    </form>

                    <div className="mt-6">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-3 bg-slate-900 text-gray-400">or continue with</span>
                            </div>
                        </div>

                        <button onClick={handleGoogleSignIn} disabled={googleLoading}
                            className="w-full py-3 px-4 bg-white/5 border border-white/10 text-white rounded-xl font-medium
                                hover:bg-white/10 transition-all duration-300 flex items-center justify-center gap-3 group">
                            {googleLoading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <><Chrome size={20} className="text-red-400" /> Sign up with Google</>
                            )}
                        </button>
                    </div>

                    <div className="mt-4 text-center">
                        <p className="text-gray-400 text-sm">
                            Already have an account?{' '}
                            <Link to="/login" className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default RegisterPage;
