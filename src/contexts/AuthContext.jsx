import { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api.service';
import { ensureUserWorkspace } from '../utils/userWorkspace';

const AuthContext = createContext(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

const normalizeRole = (value) => {
    const role = String(value || '').trim().toLowerCase();
    if (['owner', 'collaborator', 'user', 'visitor'].includes(role)) {
        return role;
    }
    return 'visitor';
};

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // User roles: 'owner', 'collaborator', 'visitor'
    const [userRole, setUserRole] = useState('visitor');

    const effectiveRole = userRole && userRole !== 'visitor'
        ? normalizeRole(userRole)
        : (user ? 'user' : 'visitor');

    useEffect(() => {
        // Check for existing session and verify token
        const verifySession = async () => {
            const token = localStorage.getItem('token');
            const savedUser = localStorage.getItem('efolio_user');
            const savedRole = localStorage.getItem('efolio_role');
            
            if (token && savedUser) {
                try {
                    // Verify token with backend
                    const response = await apiService.verifyToken();
                    if (response.success) {
                        // Use the fresh profile data returned by the server
                        const verifiedUser = response.user;
                        if (verifiedUser && verifiedUser.id) {
                            const data = {
                                id: verifiedUser.id,
                                name: verifiedUser.name,
                                username: verifiedUser.username,
                                email: verifiedUser.email,
                                avatar: verifiedUser.avatar || null,
                                role: verifiedUser.role || savedRole || 'user',
                                loginTime: new Date().toISOString()
                            };
                            const nextRole = normalizeRole(data.role || savedRole || 'user');
                            setUser(data);
                            setUserRole(nextRole);
                            localStorage.setItem('efolio_user', JSON.stringify(data));
                            localStorage.setItem('efolio_role', nextRole);
                        } else {
                            const nextRole = normalizeRole(savedRole || 'user');
                            setUser(JSON.parse(savedUser));
                            setUserRole(nextRole);
                        }
                    } else {
                        // Token invalid, clear session
                        localStorage.removeItem('token');
                        localStorage.removeItem('efolio_user');
                        localStorage.removeItem('efolio_role');
                    }
                } catch (error) {
                    console.error('Session verification failed:', error);
                    // Clear invalid session
                    localStorage.removeItem('token');
                    localStorage.removeItem('efolio_user');
                    localStorage.removeItem('efolio_role');
                }
            }
            setLoading(false);
        };
        
        verifySession();
    }, []);

    const login = async (credentials, role = 'visitor') => {
        try {
            setLoading(true);

            // Collaborator authentication via backend invite/collaborator endpoint
            if (role === 'collaborator' && credentials.email && credentials.password) {
                const response = await apiService.collaboratorLogin(
                    credentials.email,
                    credentials.password,
                    credentials.accessCode
                );

                if (response.success && response.token) {
                    const userData = {
                        id: response.user.id,
                        name: response.user.name,
                        email: response.user.email,
                        avatar: response.user.avatar || null,
                        loginTime: new Date().toISOString()
                    };

                    setUser(userData);
                    setUserRole('collaborator');

                    localStorage.setItem('token', response.token);
                    localStorage.setItem('efolio_user', JSON.stringify(userData));
                    localStorage.setItem('efolio_role', 'collaborator');

                    setLoading(false);
                    return { success: true, user: userData, role: 'collaborator' };
                }

                setLoading(false);
                return { success: false, error: response.message || 'Invalid credentials' };
            }

            // General / Owner / User authentication via backend API
            if (credentials.email && credentials.password) {
                const response = await apiService.login(credentials.email, credentials.password);
                
                if (response.success && response.token) {
                    const userData = {
                        id: response.user.id,
                        name: response.user.name,
                        email: response.user.email,
                        avatar: response.user.avatar || null,
                        loginTime: new Date().toISOString()
                    };
                    
                    const nextRole = normalizeRole(response.user.role || (userData.email === 'devtechs842@gmail.com' ? 'owner' : 'user'));
                    setUser(userData);
                    setUserRole(nextRole);
                    
                    // Store token and user data
                    localStorage.setItem('token', response.token);
                    localStorage.setItem('efolio_user', JSON.stringify(userData));
                    localStorage.setItem('efolio_role', nextRole);
                    
                    setLoading(false);
                    return { success: true, user: userData, role: nextRole };
                }

                setLoading(false);
                return { success: false, error: response.message || 'Invalid credentials' };
            }
            
            setLoading(false);
            return { success: false, error: 'Email and password are required' };
        } catch (error) {
            console.error('Login error:', error);
            setLoading(false);
            return { success: false, error: error.message || 'Login failed. Please try again.' };
        }
    };

    const logout = () => {
        setUser(null);
        setUserRole('visitor');
        localStorage.removeItem('token');
        localStorage.removeItem('efolio_user');
        localStorage.removeItem('efolio_role');
    };

    const register = async (userData) => {
        try {
            setLoading(true);
            const response = await apiService.register(userData);
            if (response.success && response.token) {
                const data = {
                    id: response.user.id,
                    name: response.user.name,
                    username: response.user.username,
                    email: response.user.email,
                    avatar: null,
                    loginTime: new Date().toISOString()
                };
                setUser(data);
                setUserRole('user');
                localStorage.setItem('token', response.token);
                localStorage.setItem('efolio_user', JSON.stringify(data));
                localStorage.setItem('efolio_role', 'user');
                setLoading(false);
                // New accounts get their own CV and portfolio records through
                // the real get-or-create APIs. Best effort: registration still
                // succeeds if the editors are temporarily unavailable, and the
                // dashboard offers a retry via "Create my CV & Portfolio".
                ensureUserWorkspace()
                    .then(status => {
                        if (status.errors.length) {
                            console.warn('[register] workspace not fully created:', status.errors.join('; '));
                        }
                    })
                    .catch(() => {});
                return { success: true, user: data, role: 'user' };
            }
            setLoading(false);
            // Surface the API's real reason (duplicate username, maintenance,
            // registration disabled) instead of a generic message.
            return { success: false, error: response?.message || 'Registration failed' };
        } catch (error) {
            setLoading(false);
            return { success: false, error: error.message || 'Registration failed' };
        }
    };

    const googleSignIn = async (credential, username) => {
        try {
            setLoading(true);
            const response = await apiService.googleSignIn(credential, username);
            if (response.success && response.token) {
                const data = {
                    id: response.user.id,
                    name: response.user.name,
                    username: response.user.username,
                    email: response.user.email,
                    avatar: response.user.avatar || null,
                    loginTime: new Date().toISOString()
                };
                setUser(data);
                setUserRole('user');
                localStorage.setItem('token', response.token);
                localStorage.setItem('efolio_user', JSON.stringify(data));
                localStorage.setItem('efolio_role', 'user');
                setLoading(false);
                return { success: true, user: data, role: 'user' };
            }
            setLoading(false);
            return { success: false, error: response.message || 'Google sign-in failed' };
        } catch (error) {
            setLoading(false);
            return { success: false, error: error.message || 'Google sign-in failed' };
        }
    };

    const isOwner = () => effectiveRole === 'owner';
    const isCollaborator = () => effectiveRole === 'collaborator';
    const isUser = () => effectiveRole === 'user';
    const isAuthenticated = () => user !== null;
    const canEdit = () => ['owner', 'collaborator', 'user'].includes(effectiveRole);

    const value = {
        user,
        userRole: effectiveRole,
        loading,
        login,
        logout,
        register,
        googleSignIn,
        isOwner,
        isCollaborator,
        isUser,
        isAuthenticated,
        canEdit
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export { AuthContext };
export default AuthProvider;

// Add displayName for better debugging
if (process.env.NODE_ENV !== 'production') {
    AuthProvider.displayName = 'AuthProvider';
}
