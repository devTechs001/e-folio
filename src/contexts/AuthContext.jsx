import { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api.service';

const AuthContext = createContext(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // User roles: 'owner', 'collaborator', 'visitor'
    const [userRole, setUserRole] = useState('visitor');

    useEffect(() => {
        // Check for existing session and verify token
        const verifySession = async () => {
            const token = localStorage.getItem('token');
            const savedUser = localStorage.getItem('efolio_user');
            const savedRole = localStorage.getItem('efolio_role');
            
            if (token && savedUser && savedRole) {
                try {
                    // Verify token with backend
                    const response = await apiService.verifyToken();
                    if (response.success) {
                        setUser(JSON.parse(savedUser));
                        setUserRole(savedRole);
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
            
            // Owner authentication via backend API
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
                    
                    setUser(userData);
                    setUserRole(response.user.role);
                    
                    // Store token and user data
                    localStorage.setItem('token', response.token);
                    localStorage.setItem('efolio_user', JSON.stringify(userData));
                    localStorage.setItem('efolio_role', response.user.role);
                    
                    setLoading(false);
                    return { success: true, user: userData, role: response.user.role };
                }
            }
            
            // Collaborator authentication (with approved invite code)
            if (role === 'collaborator' && credentials.inviteCode) {
                // TODO: Implement collaborator API endpoint
                const userData = {
                    id: Date.now(),
                    name: credentials.name || 'Collaborator',
                    email: credentials.email,
                    avatar: null,
                    loginTime: new Date().toISOString(),
                    inviteCode: credentials.inviteCode
                };

                setUser(userData);
                setUserRole('collaborator');
                
                localStorage.setItem('efolio_user', JSON.stringify(userData));
                localStorage.setItem('efolio_role', 'collaborator');
                
                setLoading(false);
                return { success: true, user: userData, role: 'collaborator' };
            }
            
            setLoading(false);
            return { success: false, error: 'Access Denied. Invalid credentials.' };
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

    const isOwner = () => userRole === 'owner';
    const isCollaborator = () => userRole === 'collaborator';
    const isAuthenticated = () => user !== null;
    const canEdit = () => userRole === 'owner' || userRole === 'collaborator';

    const value = {
        user,
        userRole,
        loading,
        login,
        logout,
        isOwner,
        isCollaborator,
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
