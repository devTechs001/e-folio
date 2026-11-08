import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Crown, Mail, Lock, ArrowLeft, LogIn, Eye, EyeOff,
    Loader2, AlertCircle, CheckCircle, ShieldCheck, UserRound
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { publicCopy, recordDevIssue } from '../utils/publicMessaging';
import '../styles/LoginPage.css';
import '../styles/OwnerLoginPage.css';

/**
 * Private sign-in for the main owner of the portfolio (phase 31).
 *
 * This is deliberately a separate page from the regular user sign-in: owner
 * credentials are checked only by /auth/login/owner, and no user account can
 * obtain an owner session from here. No owner e-mail, password hint, endpoint
 * status or technical detail is displayed.
 */
const OwnerLoginPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const result = await login({ email, password }, 'owner');
            if (result.success) {
                setSuccess('Signed in. Opening your dashboard...');
                setTimeout(() => navigate('/dashboard'), 900);
            } else {
                setError(result.error || 'We could not sign you in. Please check your credentials.');
            }
        } catch (err) {
            // Technical detail stays in the dev console; the page shows a
            // short, generic sentence (no status codes or endpoint names).
            recordDevIssue({ section: 'auth', endpoint: '/auth/login/owner', error: err });
            setError(publicCopy('auth'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page-wrapper owner-login">
            <div className="login-bg-animation">
                <div className="login-blob login-blob-1"></div>
                <div className="login-blob login-blob-2"></div>
                <div className="login-blob login-blob-3"></div>
            </div>
            <div className="login-grid-pattern"></div>

            <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    <Link to="/" className="back-home-btn group mb-8">
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform duration-300" />
                        <span>Back to Portfolio</span>
                    </Link>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1, duration: 0.3 }}
                        className="login-card owner-login__card"
                    >
                        <div className="text-center mb-8">
                            <div className="owner-login__crest">
                                <Crown size={34} />
                            </div>
                            <p className="owner-login__eyebrow">
                                <ShieldCheck size={14} /> Private owner access
                            </p>
                            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 mt-4">
                                Portfolio Owner
                            </h1>
                            <p className="text-gray-300 text-sm md:text-base">
                                Sign in to manage your portfolio, content and dashboard.
                            </p>
                        </div>

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

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="form-group">
                                <label className="form-label" htmlFor="owner-email">
                                    <Mail size={16} /> Owner Email
                                </label>
                                <div className="relative">
                                    <div className="form-icon"><Mail size={20} /></div>
                                    <input
                                        id="owner-email"
                                        type="email"
                                        name="email"
                                        value={email}
                                        onChange={e => { setEmail(e.target.value); setError(''); }}
                                        required
                                        autoComplete="username"
                                        placeholder="Enter your owner email"
                                        className="form-input"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="owner-password">
                                    <Lock size={16} /> Password
                                </label>
                                <div className="relative">
                                    <div className="form-icon"><Lock size={20} /></div>
                                    <input
                                        id="owner-password"
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={password}
                                        onChange={e => { setPassword(e.target.value); setError(''); }}
                                        required
                                        autoComplete="current-password"
                                        placeholder="Enter your password"
                                        className="form-input pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(v => !v)}
                                        className="password-toggle-btn"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <motion.button
                                type="submit"
                                disabled={loading}
                                whileHover={{ scale: loading ? 1 : 1.02 }}
                                whileTap={{ scale: loading ? 1 : 0.98 }}
                                className="submit-btn owner-login__submit"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        <span>Signing in...</span>
                                    </>
                                ) : (
                                    <>
                                        <LogIn size={20} />
                                        <span>Sign in to dashboard</span>
                                    </>
                                )}
                            </motion.button>
                        </form>

                        <div className="owner-login__note">
                            <ShieldCheck size={14} />
                            <span>Owner access is separate from user accounts.</span>
                        </div>

                        <div className="mt-8 text-center">
                            <p className="owner-login-link">
                                <UserRound size={13} /> Here to build a CV or portfolio?{' '}
                                <Link to="/login">User sign in</Link>
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default OwnerLoginPage;
