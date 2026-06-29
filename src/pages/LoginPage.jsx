import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
    User, Mail, Lock, Key, ArrowLeft, LogIn, Shield, Eye, EyeOff,
    Sparkles, AlertCircle, CheckCircle, Loader2, Github, Chrome, 
    Facebook, Twitter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/LoginPage.css';

const LoginPage = ({ collaborator = false }) => {
    const { isDarkMode } = useTheme();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        accessCode: '',
        rememberMe: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState('');
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [showAccessCodeHint, setShowAccessCodeHint] = useState(false);
    
    const { login } = useAuth();
    const navigate = useNavigate();

    // Calculate password strength
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
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
        setError(''); // Clear error on input change
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            let role = 'visitor';
            
            // Determine user role
            if (collaborator && formData.accessCode === 'COLLAB2024') {
                role = 'collaborator';
            } else if (collaborator && formData.accessCode) {
                setError('Invalid collaboration access code. Please check and try again.');
                setLoading(false);
                return;
            }

            // Attempt login via backend API
            const result = await login(formData, role);
            
            if (result.success) {
                setSuccess('Login successful! Redirecting...');
                
                setTimeout(() => {
                    if (result.role === 'owner' || result.role === 'collaborator' || result.role === 'user') {
                        navigate('/dashboard');
                    } else {
                        navigate('/');
                    }
                }, 1500);
            } else {
                setError(result.error || 'Login failed. Please check your credentials and try again.');
            }
        } catch (err) {
            setError(err.message || 'An error occurred during login. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = (provider) => {
        setError('');
        setSuccess(`Redirecting to ${provider} login...`);
        // Implement social login logic here
        setTimeout(() => {
            setSuccess('');
        }, 2000);
    };

    const getPasswordStrengthColor = () => {
        switch (passwordStrength) {
            case 1: return 'bg-red-500';
            case 2: return 'bg-orange-500';
            case 3: return 'bg-yellow-500';
            case 4: return 'bg-green-500';
            default: return 'bg-gray-500';
        }
    };

    const getPasswordStrengthText = () => {
        switch (passwordStrength) {
            case 1: return 'Weak';
            case 2: return 'Fair';
            case 3: return 'Good';
            case 4: return 'Strong';
            default: return '';
        }
    };

    return (
        <div className="login-page-wrapper">
            {/* Animated Background */}
            <div className="login-bg-animation">
                <div className="login-blob login-blob-1"></div>
                <div className="login-blob login-blob-2"></div>
                <div className="login-blob login-blob-3"></div>
            </div>

            {/* Floating Particles */}
            <div className="login-particles">
                {[...Array(20)].map((_, i) => (
                    <div key={i} className="login-particle" style={{ '--i': i }}></div>
                ))}
            </div>

            {/* Grid Pattern */}
            <div className="login-grid-pattern"></div>

            <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    {/* Back Button */}
                    <Link 
                        to="/"
                        className="back-home-btn group mb-8"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform duration-300" />
                        <span>Back to Home</span>
                    </Link>

                    {/* Login Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1, duration: 0.3 }}
                        className="login-card"
                    >
                        {/* Card Glow Effect */}
                        <div className="login-card-glow"></div>

                        {/* Header */}
                        <div className="text-center mb-8">
                            <motion.div
                                className="login-logo-wrapper"
                                whileHover={{ scale: 1.05 }}
                            >
                                <div className="login-logo">
                                    <Shield size={40} className="text-white relative z-10" />
                                    <div className="login-logo-ring login-logo-ring-1"></div>
                                    <div className="login-logo-ring login-logo-ring-2"></div>
                                    <div className="login-logo-ring login-logo-ring-3"></div>
                                </div>
                            </motion.div>
                            
                            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 mt-6">
                                Welcome Back
                            </h1>
                            <p className="text-gray-300 text-sm md:text-base">
                                {collaborator ? (
                                    <>
                                        <Sparkles size={16} className="inline-block mr-1" />
                                        Enter your collaboration credentials
                                    </>
                                ) : (
                                    'Sign in to access your account'
                                )}
                            </p>
                        </div>

                        {/* Status Messages */}
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                                    exit={{ opacity: 0, y: -10, height: 0 }}
                                    className="status-message status-error mb-6"
                                >
                                    <AlertCircle size={20} className="flex-shrink-0" />
                                    <span className="text-sm">{error}</span>
                                </motion.div>
                            )}

                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                                    exit={{ opacity: 0, y: -10, height: 0 }}
                                    className="status-message status-success mb-6"
                                >
                                    <CheckCircle size={20} className="flex-shrink-0" />
                                    <span className="text-sm">{success}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Name Field */}
                            <div className="form-group">
                                <label className="form-label">
                                    <User size={16} />
                                    Full Name
                                </label>
                                <div className="relative">
                                    <div className="form-icon">
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
                                        className={`form-input ${focusedField === 'name' ? 'form-input-focused' : ''}`}
                                    />
                                </div>
                            </div>

                            {/* Email Field */}
                            <div className="form-group">
                                <label className="form-label">
                                    <Mail size={16} />
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="form-icon">
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
                                        className={`form-input ${focusedField === 'email' ? 'form-input-focused' : ''}`}
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="form-group">
                                <label className="form-label">
                                    <Lock size={16} />
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="form-icon">
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
                                        className={`form-input pr-12 ${focusedField === 'password' ? 'form-input-focused' : ''}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="password-toggle-btn"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                
                                {/* Password Strength Indicator */}
                                {formData.password && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-2"
                                    >
                                        <div className="password-strength-bar">
                                            <div 
                                                className={`password-strength-fill ${getPasswordStrengthColor()}`}
                                                style={{ width: `${(passwordStrength / 4) * 100}%` }}
                                            ></div>
                                        </div>
                                        <p className="password-strength-text">
                                            Password Strength: <span className={getPasswordStrengthColor().replace('bg-', 'text-')}>{getPasswordStrengthText()}</span>
                                        </p>
                                    </motion.div>
                                )}
                            </div>

                            {/* Access Code (Collaborator Only) */}
                            {collaborator && (
                                <div className="form-group">
                                    <label className="form-label">
                                        <Key size={16} />
                                        Access Code
                                        <button
                                            type="button"
                                            onClick={() => setShowAccessCodeHint(!showAccessCodeHint)}
                                            className="ml-2 text-purple-400 hover:text-purple-300 transition-colors"
                                        >
                                            <AlertCircle size={14} />
                                        </button>
                                    </label>
                                    <div className="relative">
                                        <div className="form-icon">
                                            <Key size={20} />
                                        </div>
                                        <input
                                            type="text"
                                            name="accessCode"
                                            value={formData.accessCode}
                                            onChange={handleChange}
                                            onFocus={() => setFocusedField('accessCode')}
                                            onBlur={() => setFocusedField('')}
                                            placeholder="Enter collaboration code"
                                            className={`form-input ${focusedField === 'accessCode' ? 'form-input-focused' : ''}`}
                                        />
                                    </div>
                                    {showAccessCodeHint && (
                                        <motion.p
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-2 text-xs text-gray-400 bg-gray-800/50 p-2 rounded-lg"
                                        >
                                            💡 Contact the portfolio owner for your collaboration access code
                                        </motion.p>
                                    )}
                                </div>
                            )}

                            {/* Remember Me & Forgot Password */}
                            <div className="flex items-center justify-between text-sm">
                                <label className="remember-me-label">
                                    <input
                                        type="checkbox"
                                        name="rememberMe"
                                        checked={formData.rememberMe}
                                        onChange={handleChange}
                                        className="remember-me-checkbox"
                                    />
                                    <span className="ml-2 text-gray-300">Remember me</span>
                                </label>
                                <Link to="/forgot-password" className="forgot-password-link">
                                    Forgot password?
                                </Link>
                            </div>

                            {/* Submit Button */}
                            <motion.button
                                type="submit"
                                disabled={loading}
                                whileHover={{ scale: loading ? 1 : 1.02 }}
                                whileTap={{ scale: loading ? 1 : 0.98 }}
                                className="submit-btn group"
                            >
                                <div className="submit-btn-glow"></div>
                                {loading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        <span>Signing in...</span>
                                    </>
                                ) : (
                                    <>
                                        <LogIn size={20} className="group-hover:translate-x-1 transition-transform duration-300" />
                                        <span>Sign In</span>
                                    </>
                                )}
                                <div className="submit-btn-shine"></div>
                            </motion.button>
                        </form>

                        {/* Divider */}
                        <div className="login-divider">
                            <div className="login-divider-line"></div>
                            <span className="login-divider-text">Or continue with</span>
                            <div className="login-divider-line"></div>
                        </div>

                        {/* Social Login */}
                        <div className="social-login-grid">
                            <button
                                type="button"
                                onClick={() => handleSocialLogin('Google')}
                                className="social-login-btn social-login-google"
                            >
                                <Chrome size={20} />
                                <span className="hidden sm:inline">Google</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSocialLogin('GitHub')}
                                className="social-login-btn social-login-github"
                            >
                                <Github size={20} />
                                <span className="hidden sm:inline">GitHub</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSocialLogin('Facebook')}
                                className="social-login-btn social-login-facebook"
                            >
                                <Facebook size={20} />
                                <span className="hidden sm:inline">Facebook</span>
                            </button>
                        </div>

                        {/* Footer */}
                        <div className="mt-8 text-center">
                            <p className="text-gray-400 text-sm">
                                Don't have an account?{' '}
                                <Link to="/register" className="signup-link">
                                    Sign up now
                                </Link>
                            </p>
                            {collaborator && (
                                <p className="text-gray-500 text-xs mt-2">
                                    <Shield size={12} className="inline-block mr-1" />
                                    Collaboration access is invite-only
                                </p>
                            )}
                        </div>
                    </motion.div>

                    {/* Security Badge */}
                    <div className="security-badge">
                        <Shield size={14} />
                        <span>Secure & Encrypted Connection</span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default LoginPage;