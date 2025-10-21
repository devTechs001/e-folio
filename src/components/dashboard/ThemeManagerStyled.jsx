import React from 'react';
import { motion } from 'framer-motion';
import { Palette, Check, Download, Upload } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../NotificationSystem';
import DashboardLayout from './DashboardLayout';

const ThemeManager = () => {
    const { theme, themes, changeTheme, currentTheme } = useTheme();
    const { success } = useNotifications();

    const handleThemeChange = (themeId) => {
        changeTheme(themeId);
        success(`Theme changed to ${themes.find(t => t.id === themeId)?.name}`);
    };

    return (
        <DashboardLayout
            title="Theme Manager"
            subtitle="Customize your dashboard appearance"
        >
            <div style={{ padding: '24px' }}>
                {/* Current Theme */}
                <div style={{
                    marginBottom: '32px',
                    padding: '24px',
                    background: `${theme.surface}80`,
                    borderRadius: '16px',
                    border: `1px solid ${theme.border}`,
                    backdropFilter: 'blur(10px)'
                }}>
                    <h3 style={{
                        color: theme.text,
                        fontSize: '20px',
                        fontWeight: '600',
                        marginBottom: '16px',
                        fontFamily: theme.fontHeading
                    }}>Current Theme</h3>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px'
                    }}>
                        <div style={{
                            width: '120px',
                            height: '80px',
                            borderRadius: '12px',
                            background: theme.gradient,
                            boxShadow: `0 8px 24px ${theme.primary}40`
                        }} />
                        <div>
                            <h4 style={{
                                color: theme.text,
                                fontSize: '24px',
                                fontWeight: '700',
                                margin: '0 0 8px 0'
                            }}>{themes.find(t => t.id === currentTheme)?.name}</h4>
                            <p style={{
                                color: theme.textSecondary,
                                margin: 0,
                                fontSize: '14px'
                            }}>Active theme - {currentTheme}</p>
                        </div>
                    </div>
                </div>

                {/* Theme Grid */}
                <h3 style={{
                    color: theme.text,
                    fontSize: '20px',
                    fontWeight: '600',
                    marginBottom: '20px',
                    fontFamily: theme.fontHeading
                }}>Available Themes</h3>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '20px'
                }}>
                    {themes.map((themeOption) => (
                        <motion.div
                            key={themeOption.id}
                            whileHover={{ scale: 1.03, y: -4 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleThemeChange(themeOption.id)}
                            style={{
                                padding: '24px',
                                background: `${theme.surface}80`,
                                borderRadius: '16px',
                                border: `2px solid ${currentTheme === themeOption.id ? themeOption.primary : theme.border}`,
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                position: 'relative',
                                overflow: 'hidden',
                                backdropFilter: 'blur(10px)'
                            }}
                        >
                            {currentTheme === themeOption.id && (
                                <div style={{
                                    position: 'absolute',
                                    top: '12px',
                                    right: '12px',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: themeOption.gradient,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: `0 4px 12px ${themeOption.primary}60`
                                }}>
                                    <Check size={18} style={{ color: themeOption.background }} />
                                </div>
                            )}
                            <div style={{
                                width: '100%',
                                height: '120px',
                                borderRadius: '12px',
                                background: themeOption.gradient,
                                marginBottom: '16px',
                                boxShadow: `0 8px 24px ${themeOption.primary}40`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: themeOption.background,
                                fontSize: '40px',
                                fontWeight: '700'
                            }}>
                                <Palette size={48} />
                            </div>
                            <h4 style={{
                                color: theme.text,
                                fontSize: '18px',
                                fontWeight: '600',
                                margin: '0 0 8px 0'
                            }}>{themeOption.name}</h4>
                            <div style={{
                                display: 'flex',
                                gap: '8px',
                                marginBottom: '12px'
                            }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    background: themeOption.primary,
                                    border: `2px solid ${theme.border}`
                                }} />
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    background: themeOption.secondary,
                                    border: `2px solid ${theme.border}`
                                }} />
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    background: themeOption.accent,
                                    border: `2px solid ${theme.border}`
                                }} />
                            </div>
                            <p style={{
                                color: theme.textSecondary,
                                fontSize: '13px',
                                margin: 0
                            }}>Font: {themeOption.fontFamily?.split(',')[0]?.replace(/'/g, '')}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ThemeManager;
