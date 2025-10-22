import { useState } from 'react';
import { Palette, Check, Zap } from 'lucide-react';
import { useLandingPageTheme } from '../contexts/LandingPageThemeContext';

const ThemeSwitcher = () => {
    const { theme, currentTheme, autoChange, changeTheme, toggleAutoChange, availableThemes } = useLandingPageTheme();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div style={{
            position: 'fixed',
            top: '100px',
            right: '20px',
            zIndex: 1000
        }}>
            {/* Floating Theme Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: theme.gradient,
                    border: `2px solid ${theme.mainColor}`,
                    boxShadow: `0 4px 20px ${theme.mainColor}40`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    transition: 'all 0.3s ease',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = isOpen ? 'rotate(180deg) scale(1.1)' : 'rotate(0deg) scale(1.1)';
                    e.currentTarget.style.boxShadow = `0 6px 30px ${theme.mainColor}60`;
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
                    e.currentTarget.style.boxShadow = `0 4px 20px ${theme.mainColor}40`;
                }}
            >
                <Palette size={24} />
            </button>

            {/* Theme Panel */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '70px',
                    right: '0',
                    width: '300px',
                    background: theme.bgColor,
                    border: `2px solid ${theme.mainColor}40`,
                    borderRadius: '16px',
                    padding: '20px',
                    boxShadow: `0 8px 32px rgba(0, 0, 0, 0.5)`,
                    backdropFilter: 'blur(10px)',
                    animation: 'slideIn 0.3s ease'
                }}>
                    <style>{`
                        @keyframes slideIn {
                            from {
                                opacity: 0;
                                transform: translateY(-10px);
                            }
                            to {
                                opacity: 1;
                                transform: translateY(0);
                            }
                        }
                    `}</style>

                    <h3 style={{
                        color: theme.textColor,
                        fontSize: '18px',
                        fontWeight: '700',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <Palette size={20} />
                        Landing Page Themes
                    </h3>

                    {/* Auto-Change Toggle */}
                    <div
                        onClick={toggleAutoChange}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px',
                            marginBottom: '16px',
                            background: autoChange ? theme.mainColor + '20' : theme.sbgColor,
                            border: `1px solid ${autoChange ? theme.mainColor : 'transparent'}`,
                            borderRadius: '10px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Zap size={18} style={{ color: theme.mainColor }} />
                            <span style={{ color: theme.textColor, fontSize: '14px', fontWeight: '600' }}>
                                Auto-Change (30s)
                            </span>
                        </div>
                        <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '4px',
                            background: autoChange ? theme.mainColor : 'transparent',
                            border: `2px solid ${theme.mainColor}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.3s ease'
                        }}>
                            {autoChange && <Check size={14} style={{ color: theme.bgColor }} />}
                        </div>
                    </div>

                    {/* Theme Options */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        maxHeight: '400px',
                        overflowY: 'auto'
                    }}>
                        {availableThemes.map((themeOption) => (
                            <div
                                key={themeOption.id}
                                onClick={() => changeTheme(themeOption.id)}
                                style={{
                                    padding: '12px',
                                    background: currentTheme === themeOption.id 
                                        ? themeOption.gradient 
                                        : theme.sbgColor,
                                    border: `2px solid ${currentTheme === themeOption.id 
                                        ? themeOption.mainColor 
                                        : 'transparent'}`,
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}
                                onMouseEnter={(e) => {
                                    if (currentTheme !== themeOption.id) {
                                        e.currentTarget.style.background = themeOption.mainColor + '20';
                                        e.currentTarget.style.borderColor = themeOption.mainColor + '40';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (currentTheme !== themeOption.id) {
                                        e.currentTarget.style.background = theme.sbgColor;
                                        e.currentTarget.style.borderColor = 'transparent';
                                    }
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '8px',
                                        background: themeOption.gradient,
                                        border: `2px solid ${themeOption.mainColor}`
                                    }} />
                                    <div>
                                        <div style={{
                                            color: currentTheme === themeOption.id ? '#fff' : theme.textColor,
                                            fontSize: '14px',
                                            fontWeight: '600'
                                        }}>
                                            {themeOption.name}
                                        </div>
                                        <div style={{
                                            color: currentTheme === themeOption.id ? '#fff' : theme.textColor + '80',
                                            fontSize: '11px'
                                        }}>
                                            {themeOption.pattern}
                                        </div>
                                    </div>
                                </div>
                                {currentTheme === themeOption.id && (
                                    <Check size={20} style={{ color: '#fff' }} />
                                )}
                            </div>
                        ))}
                    </div>

                    <div style={{
                        marginTop: '16px',
                        padding: '12px',
                        background: theme.sbgColor,
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: theme.textColor + '80',
                        textAlign: 'center'
                    }}>
                        {autoChange 
                            ? '🔄 Themes cycling automatically' 
                            : '⏸️ Auto-change disabled'}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ThemeSwitcher;
