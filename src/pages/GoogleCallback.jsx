import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const GoogleCallback = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { googleSignIn } = useAuth();

    useEffect(() => {
        const handleCallback = async () => {
            const params = new URLSearchParams(location.hash.replace('#', ''));
            const credential = params.get('id_token');

            if (credential) {
                const result = await googleSignIn(credential);
                if (result.success) {
                    navigate('/dashboard');
                } else {
                    navigate('/register?error=google_failed');
                }
            } else {
                const urlParams = new URLSearchParams(location.search);
                const error = urlParams.get('error');
                if (error) {
                    navigate('/register?error=' + error);
                } else {
                    navigate('/register?error=no_credential');
                }
            }
        };
        handleCallback();
    }, []);

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4" />
                <p className="text-slate-400">Completing Google sign-in...</p>
            </div>
        </div>
    );
};

export default GoogleCallback;
