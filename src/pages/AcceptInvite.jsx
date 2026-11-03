import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { CheckCircle, AlertCircle, Lock, User, Mail, Loader2 } from 'lucide-react';
import apiService from '../services/api.service';

/**
 * Destination for every collaboration invite link.
 *
 * The backend stores only a SHA-256 hash of the token; this page passes the
 * raw token from the URL straight to the validate/accept endpoints. Those two
 * routes are anonymous because an invitee has no account yet.
 */
const AcceptInvite = () => {
    const { token } = useParams();
    const navigate = useNavigate();

    const [status, setStatus] = useState('validating'); // validating | ready | invalid | done
    const [invite, setInvite] = useState(null);
    const [error, setError] = useState('');
    const [form, setForm] = useState({ name: '', password: '', confirmPassword: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const validate = async () => {
            if (!token) {
                setStatus('invalid');
                setError('This invitation link is missing its token.');
                return;
            }
            try {
                const response = await apiService.validateInviteToken(token);
                if (cancelled) return;
                if (response?.success && response.invite) {
                    setInvite(response.invite);
                    setStatus('ready');
                } else {
                    setStatus('invalid');
                    setError(response?.message || 'Invalid or expired invitation.');
                }
            } catch (err) {
                if (cancelled) return;
                setStatus('invalid');
                setError(err?.message || 'We could not verify this invitation. Please try again later.');
            }
        };
        validate();
        return () => { cancelled = true; };
    }, [token]);

    const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        if (form.password.length < 8) {
            setError('Use a password of at least 8 characters.');
            return;
        }
        if (form.password !== form.confirmPassword) {
            setError('The passwords do not match.');
            return;
        }

        setSubmitting(true);
        try {
            const response = await apiService.acceptInvite(token, {
                name: form.name.trim(),
                password: form.password
            });

            if (response?.success) {
                // Mirror the storage keys used by AuthContext so the new
                // collaborator lands in an authenticated session.
                if (response.token) localStorage.setItem('token', response.token);
                if (response.user) {
                    localStorage.setItem('efolio_user', JSON.stringify(response.user));
                    localStorage.setItem('efolio_role', response.user.role || 'collaborator');
                }
                setStatus('done');
                return;
            }

            if (response?.code === 'USER_EXISTS') {
                setError('An account already exists for this email. Please sign in instead.');
            } else {
                setError(response?.message || 'We could not accept this invitation.');
            }
        } catch (err) {
            // apiService.request throws on non-2xx, so the 409 USER_EXISTS
            // case arrives here rather than in the success branch above.
            const message = err?.message || 'We could not accept this invitation.';
            setError(/already exists/i.test(message)
                ? 'An account already exists for this email. Please sign in instead.'
                : message);
        } finally {
            setSubmitting(false);
        }
    };

    const card = {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#e2e8f0',
        fontFamily: 'Inter, system-ui, sans-serif'
    };
    const panel = {
        width: '100%',
        maxWidth: '460px',
        padding: '36px',
        borderRadius: '18px',
        background: 'rgba(15, 23, 42, 0.85)',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)'
    };
    const input = {
        width: '100%',
        padding: '12px 14px',
        marginTop: '6px',
        borderRadius: '10px',
        border: '1px solid rgba(148, 163, 184, 0.35)',
        background: 'rgba(30, 41, 59, 0.8)',
        color: '#f8fafc',
        outline: 'none'
    };
    const button = {
        width: '100%',
        padding: '13px',
        marginTop: '22px',
        borderRadius: '10px',
        border: 'none',
        fontWeight: 600,
        cursor: submitting ? 'wait' : 'pointer',
        background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
        color: 'white'
    };

    return (
        <div style={card}>
            <div style={panel}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
                    Collaboration invitation
                </h1>
                <p style={{ color: '#94a3b8', marginBottom: '26px', lineHeight: 1.6 }}>
                    Accept your invitation to create a collaborator account.
                </p>

                {status === 'validating' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Loader2 size={20} className="animate-spin" />
                        <span>Verifying your invitation…</span>
                    </div>
                )}

                {status === 'invalid' && (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fca5a5' }}>
                            <AlertCircle size={20} />
                            <span>{error}</span>
                        </div>
                        <p style={{ marginTop: '20px', color: '#94a3b8', fontSize: '14px' }}>
                            Invitations expire after 7 days. Ask the owner to resend it from the
                            collaboration dashboard.
                        </p>
                        <Link to="/" style={{ display: 'inline-block', marginTop: '22px', color: '#93c5fd' }}>
                            Back to home
                        </Link>
                    </div>
                )}

                {status === 'done' && (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#86efac' }}>
                            <CheckCircle size={22} />
                            <span>Your account is ready.</span>
                        </div>
                        <button style={button} onClick={() => navigate('/workspace')}>
                            Open my workspace
                        </button>
                    </div>
                )}

                {status === 'ready' && (
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: '#cbd5e1' }}>
                            <Mail size={16} />
                            <span style={{ fontSize: '14px' }}>
                                Invited as <strong>{invite?.email}</strong> · {invite?.role || 'collaborator'}
                            </span>
                        </div>

                        <label style={{ display: 'block', fontSize: '14px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <User size={14} /> Full name
                            </span>
                            <input style={input} value={form.name} onChange={update('name')} required minLength={2} />
                        </label>

                        <label style={{ display: 'block', fontSize: '14px', marginTop: '16px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Lock size={14} /> Password
                            </span>
                            <input style={input} type="password" value={form.password} onChange={update('password')} required minLength={8} />
                        </label>

                        <label style={{ display: 'block', fontSize: '14px', marginTop: '16px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Lock size={14} /> Confirm password
                            </span>
                            <input style={input} type="password" value={form.confirmPassword} onChange={update('confirmPassword')} required minLength={8} />
                        </label>

                        {error && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', color: '#fca5a5', fontSize: '14px' }}>
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}

                        <button style={button} type="submit" disabled={submitting}>
                            {submitting ? 'Creating account…' : 'Accept invitation'}
                        </button>

                        <Link to="/login" style={{ display: 'block', textAlign: 'center', marginTop: '18px', color: '#93c5fd', fontSize: '14px' }}>
                            Already have an account? Sign in
                        </Link>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AcceptInvite;
