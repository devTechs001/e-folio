import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

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
            
            // Determine user role based on credentials
            if (formData.email === 'owner@efolio.com' && formData.password === 'owner123') {
                role = 'owner';
            } else if (collaborator && formData.accessCode === 'COLLAB2024') {
                role = 'collaborator';
            } else if (collaborator) {
                throw new Error('Invalid collaboration access code');
            }

            const result = await login(formData, role);
            
            if (result.success) {
                if (role === 'owner' || role === 'collaborator') {
                    navigate('/dashboard');
                } else {
                    navigate('/');
                }
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError(err.message);
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
                        <label style={{ color: '#ededed', display: 'block', marginBottom: '8px' }}>
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
                                padding: '12px',
                                background: 'transparent',
                                border: '2px solid #0ef',
                                borderRadius: '8px',
                                color: '#ededed',
                                fontSize: '16px'
                            }}
                            placeholder="Enter your name"
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label style={{ color: '#ededed', display: 'block', marginBottom: '8px' }}>
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
                                padding: '12px',
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
                        <label style={{ color: '#ededed', display: 'block', marginBottom: '8px' }}>
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
                                padding: '12px',
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
                            <label style={{ color: '#ededed', display: 'block', marginBottom: '8px' }}>
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
                                    padding: '12px',
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
                            transition: 'all 0.3s ease'
                        }}
                    >
                        {loading ? 'Signing In...' : (collaborator ? 'Access Collaboration' : 'Sign In')}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <Link 
                        to="/" 
                        style={{
                            color: '#0ef',
                            textDecoration: 'none',
                            fontSize: '14px'
                        }}
                    >
                        ← Back to Portfolio
                    </Link>
                </div>

                {/* Demo Credentials */}
                <div style={{
                    marginTop: '30px',
                    padding: '15px',
                    background: 'rgba(0, 239, 255, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid #0ef'
                }}>
                    <h4 style={{ color: '#0ef', marginBottom: '10px', fontSize: '14px' }}>
                        Demo Credentials:
                    </h4>
                    <p style={{ color: '#ededed', fontSize: '12px', margin: '5px 0' }}>
                        <strong>Owner:</strong> owner@efolio.com / owner123
                    </p>
                    {collaborator && (
                        <p style={{ color: '#ededed', fontSize: '12px', margin: '5px 0' }}>
                            <strong>Collab Code:</strong> COLLAB2024
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
