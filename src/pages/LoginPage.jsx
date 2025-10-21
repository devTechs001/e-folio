import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Lock, Key, ArrowLeft, LogIn, Shield } from 'lucide-react';

const LoginPage = ({ collaborator = false }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        accessCode: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
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
        <div className="login-page" style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #081b29, #0ef)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div className="login-container" style={{
                background: 'rgba(8, 27, 41, 0.95)',
                padding: '40px',
                borderRadius: '15px',
                boxShadow: '0 15px 35px rgba(0, 0, 0, 0.3)',
                border: '2px solid #0ef',
                maxWidth: '400px',
                width: '100%'
            }}>
                <div className="login-header" style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
                        {collaborator ? (
                            <Shield size={48} color="#0ef" strokeWidth={2} />
                        ) : (
                            <LogIn size={48} color="#0ef" strokeWidth={2} />
                        )}
                    </div>
                    <h2 style={{ color: '#0ef', marginBottom: '10px' }}>
                        {collaborator ? 'Collaborate Access' : 'Portfolio Access'}
                    </h2>
                    <p style={{ color: '#ededed', fontSize: '14px' }}>
                        {collaborator 
                            ? 'Enter your collaboration details to access advanced features'
                            : 'Sign in to access dashboard features'
                        }
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label style={{ color: '#ededed', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <User size={18} color="#0ef" />
                            Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            style={{
                                width: '100%',
                                padding: '12px 12px 12px 40px',
                                background: 'transparent',
                                border: '2px solid #0ef',
                                borderRadius: '8px',
                                color: '#ededed',
                                fontSize: '16px',
                                position: 'relative'
                            }}
                            placeholder="Enter your name"
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label style={{ color: '#ededed', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <Mail size={18} color="#0ef" />
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            style={{
                                width: '100%',
                                padding: '12px 12px 12px 40px',
                                background: 'transparent',
                                border: '2px solid #0ef',
                                borderRadius: '8px',
                                color: '#ededed',
                                fontSize: '16px'
                            }}
                            placeholder="Enter your email"
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label style={{ color: '#ededed', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <Lock size={18} color="#0ef" />
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            style={{
                                width: '100%',
                                padding: '12px 12px 12px 40px',
                                background: 'transparent',
                                border: '2px solid #0ef',
                                borderRadius: '8px',
                                color: '#ededed',
                                fontSize: '16px'
                            }}
                            placeholder="Enter your password"
                        />
                    </div>

                    {collaborator && (
                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <label style={{ color: '#ededed', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <Key size={18} color="#0ef" />
                                Collaboration Access Code
                            </label>
                            <input
                                type="text"
                                name="accessCode"
                                value={formData.accessCode}
                                onChange={handleChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px 12px 12px 40px',
                                    background: 'transparent',
                                    border: '2px solid #0ef',
                                    borderRadius: '8px',
                                    color: '#ededed',
                                    fontSize: '16px'
                                }}
                                placeholder="Enter collaboration code"
                            />
                        </div>
                    )}

                    {error && (
                        <div style={{
                            color: '#ff4444',
                            background: 'rgba(255, 68, 68, 0.1)',
                            padding: '10px',
                            borderRadius: '5px',
                            marginBottom: '20px',
                            textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: loading ? '#666' : 'linear-gradient(45deg, #0ef, #00d4ff)',
                            color: '#081b29',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                    >
                        {loading ? (
                            'Signing In...'
                        ) : (
                            <>
                                <LogIn size={20} />
                                {collaborator ? 'Access Collaboration' : 'Sign In'}
                            </>
                        )}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <Link 
                        to="/" 
                        style={{
                            color: '#0ef',
                            textDecoration: 'none',
                            fontSize: '14px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <ArrowLeft size={16} />
                        Back to Portfolio
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
