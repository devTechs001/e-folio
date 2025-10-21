import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const DashboardLayout = ({ children, title, subtitle, actions }) => {
    const { theme } = useTheme();

    return (
        <div 
            className="dashboard-layout"
            style={{
                minHeight: '100vh',
                background: theme.background,
                padding: '20px',
                width: '100%'
            }}
        >
            {/* Page Header */}
            {(title || actions) && (
                <div 
                    className="page-header"
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '24px',
                        padding: '20px',
                        background: `linear-gradient(135deg, ${theme.surface}90, ${theme.background}90)`,
                        borderRadius: '16px',
                        border: `1px solid ${theme.border}`,
                        backdropFilter: 'blur(10px)',
                        flexWrap: 'wrap',
                        gap: '16px'
                    }}
                >
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        {title && (
                            <h1 style={{
                                margin: 0,
                                fontSize: 'clamp(24px, 4vw, 32px)',
                                fontWeight: '700',
                                color: theme.text,
                                fontFamily: theme.fontHeading,
                                background: theme.gradient,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}>
                                {title}
                            </h1>
                        )}
                        {subtitle && (
                            <p style={{
                                margin: '8px 0 0',
                                fontSize: '14px',
                                color: theme.textSecondary,
                                fontWeight: '500'
                            }}>
                                {subtitle}
                            </p>
                        )}
                    </div>
                    {actions && (
                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            flexWrap: 'wrap'
                        }}>
                            {actions}
                        </div>
                    )}
                </div>
            )}

            {/* Page Content */}
            <div 
                className="page-content"
                style={{
                    background: `${theme.surface}40`,
                    borderRadius: '16px',
                    border: `1px solid ${theme.border}`,
                    minHeight: 'calc(100vh - 180px)',
                    backdropFilter: 'blur(10px)'
                }}
            >
                {children}
            </div>
        </div>
    );
};

export default DashboardLayout;
