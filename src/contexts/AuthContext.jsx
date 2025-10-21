import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // User roles: 'owner', 'collaborator', 'visitor'
    const [userRole, setUserRole] = useState('visitor');

    useEffect(() => {
        // Check for existing session
        const savedUser = localStorage.getItem('efolio_user');
        const savedRole = localStorage.getItem('efolio_role');
        
        if (savedUser && savedRole) {
            setUser(JSON.parse(savedUser));
            setUserRole(savedRole);
        }
        setLoading(false);
    }, []);

    const login = async (credentials, role = 'visitor') => {
        try {
            // Owner authentication - ONLY devtechs842@gmail.com
            if (credentials.email === 'devtechs842@gmail.com' && credentials.password === 'pass1234') {
                const ownerData = {
                    id: 'owner-001',
                    name: 'Portfolio Owner',
                    email: 'devtechs842@gmail.com',
                    avatar: null,
                    loginTime: new Date().toISOString()
                };
                
                setUser(ownerData);
                setUserRole('owner');
                
                localStorage.setItem('efolio_user', JSON.stringify(ownerData));
                localStorage.setItem('efolio_role', 'owner');
                
                return { success: true, user: ownerData, role: 'owner' };
            }
            
            // Collaborator authentication (with approved invite code)
            if (role === 'collaborator' && credentials.inviteCode) {
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
                
                return { success: true, user: userData, role: 'collaborator' };
            }
            
            // Invalid credentials
            return { success: false, error: 'Access Denied. Invalid credentials.' };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    };

    const logout = () => {
        setUser(null);
        setUserRole('visitor');
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
            {!loading && children}
        </AuthContext.Provider>
    );
};
