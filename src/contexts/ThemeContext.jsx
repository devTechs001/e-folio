import React, { createContext, useContext, useState, useEffect } from 'react';
import { themePresets, getThemeNames } from '../themes/themePresets';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

// Comprehensive Theme Definitions
export const themes = {
    cyber: {
        id: 'cyber',
        name: 'Cyber Neon',
        primary: '#00efff',
        secondary: '#00d4ff',
        accent: '#ff00ff',
        background: '#081b29',
        surface: '#0f2438',
        text: '#ededed',
        textSecondary: '#b0b0b0',
        border: 'rgba(0, 239, 255, 0.2)',
        gradient: 'linear-gradient(135deg, #00efff 0%, #00d4ff 100%)',
        fontFamily: "'Orbitron', 'Poppins', sans-serif",
        fontHeading: "'Orbitron', sans-serif",
        fontBody: "'Poppins', sans-serif"
    },
    professional: {
        id: 'professional',
        name: 'Professional Blue',
        primary: '#2563eb',
        secondary: '#3b82f6',
        accent: '#60a5fa',
        background: '#0f172a',
        surface: '#1e293b',
        text: '#f1f5f9',
        textSecondary: '#94a3b8',
        border: 'rgba(37, 99, 235, 0.2)',
        gradient: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
        fontFamily: "'Inter', sans-serif",
        fontHeading: "'Inter', sans-serif",
        fontBody: "'Inter', sans-serif"
    },
    dark: {
        id: 'dark',
        name: 'Dark Elegance',
        primary: '#8b5cf6',
        secondary: '#a78bfa',
        accent: '#c4b5fd',
        background: '#0a0a0a',
        surface: '#1a1a1a',
        text: '#ffffff',
        textSecondary: '#a0a0a0',
        border: 'rgba(139, 92, 246, 0.2)',
        gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
        fontFamily: "'Space Grotesk', sans-serif",
        fontHeading: "'Space Grotesk', sans-serif",
        fontBody: "'Space Grotesk', sans-serif"
    },
    ocean: {
        id: 'ocean',
        name: 'Ocean Breeze',
        primary: '#06b6d4',
        secondary: '#0891b2',
        accent: '#22d3ee',
        background: '#001f3f',
        surface: '#003a5c',
        text: '#e0f2fe',
        textSecondary: '#7dd3fc',
        border: 'rgba(6, 182, 212, 0.2)',
        gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
        fontFamily: "'Montserrat', sans-serif",
        fontHeading: "'Montserrat', sans-serif",
        fontBody: "'Montserrat', sans-serif"
    },
    sunset: {
        id: 'sunset',
        name: 'Sunset Vibes',
        primary: '#f97316',
        secondary: '#fb923c',
        accent: '#fdba74',
        background: '#1a0f0a',
        surface: '#2d1810',
        text: '#fff7ed',
        textSecondary: '#fed7aa',
        border: 'rgba(249, 115, 22, 0.2)',
        gradient: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
        fontFamily: "'Rajdhani', sans-serif",
        fontHeading: "'Rajdhani', sans-serif",
        fontBody: "'Rajdhani', sans-serif"
    },
    forest: {
        id: 'forest',
        name: 'Forest Green',
        primary: '#10b981',
        secondary: '#34d399',
        accent: '#6ee7b7',
        background: '#0a2f1f',
        surface: '#134e3a',
        text: '#ecfdf5',
        textSecondary: '#a7f3d0',
        border: 'rgba(16, 185, 129, 0.2)',
        gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
        fontFamily: "'Poppins', sans-serif",
        fontHeading: "'Poppins', sans-serif",
        fontBody: "'Poppins', sans-serif"
    },
    rose: {
        id: 'rose',
        name: 'Rose Gold',
        primary: '#ec4899',
        secondary: '#f472b6',
        accent: '#f9a8d4',
        background: '#1a0614',
        surface: '#2d0a1f',
        text: '#fdf2f8',
        textSecondary: '#fbcfe8',
        border: 'rgba(236, 72, 153, 0.2)',
        gradient: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
        fontFamily: "'Montserrat', sans-serif",
        fontHeading: "'Montserrat', sans-serif",
        fontBody: "'Montserrat', sans-serif"
    },
    amber: {
        id: 'amber',
        name: 'Amber Glow',
        primary: '#f59e0b',
        secondary: '#fbbf24',
        accent: '#fcd34d',
        background: '#1a1004',
        surface: '#2d1c08',
        text: '#fffbeb',
        textSecondary: '#fde68a',
        border: 'rgba(245, 158, 11, 0.2)',
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
        fontFamily: "'Inter', sans-serif",
        fontHeading: "'Inter', sans-serif",
        fontBody: "'Inter', sans-serif"
    },
    midnight: {
        id: 'midnight',
        name: 'Midnight Blue',
        primary: '#3b82f6',
        secondary: '#60a5fa',
        accent: '#93c5fd',
        background: '#020617',
        surface: '#0f172a',
        text: '#f8fafc',
        textSecondary: '#cbd5e1',
        border: 'rgba(59, 130, 246, 0.2)',
        gradient: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
        fontFamily: "'Space Grotesk', sans-serif",
        fontHeading: "'Space Grotesk', sans-serif",
        fontBody: "'Space Grotesk', sans-serif"
    },
    crimson: {
        id: 'crimson',
        name: 'Crimson Red',
        primary: '#dc2626',
        secondary: '#ef4444',
        accent: '#f87171',
        background: '#1a0505',
        surface: '#2d0a0a',
        text: '#fef2f2',
        textSecondary: '#fecaca',
        border: 'rgba(220, 38, 38, 0.2)',
        gradient: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
        fontFamily: "'Rajdhani', sans-serif",
        fontHeading: "'Rajdhani', sans-serif",
        fontBody: "'Rajdhani', sans-serif"
    },
    mint: {
        id: 'mint',
        name: 'Mint Fresh',
        primary: '#14b8a6',
        secondary: '#2dd4bf',
        accent: '#5eead4',
        background: '#042f2e',
        surface: '#0f5254',
        text: '#f0fdfa',
        textSecondary: '#99f6e4',
        border: 'rgba(20, 184, 166, 0.2)',
        gradient: 'linear-gradient(135deg, #14b8a6 0%, #2dd4bf 100%)',
        fontFamily: "'Poppins', sans-serif",
        fontHeading: "'Poppins', sans-serif",
        fontBody: "'Poppins', sans-serif"
    },
    lavender: {
        id: 'lavender',
        name: 'Lavender Dream',
        primary: '#a855f7',
        secondary: '#c084fc',
        accent: '#d8b4fe',
        background: '#1a0a2e',
        surface: '#2d1245',
        text: '#faf5ff',
        textSecondary: '#e9d5ff',
        border: 'rgba(168, 85, 247, 0.2)',
        gradient: 'linear-gradient(135deg, #a855f7 0%, #c084fc 100%)',
        fontFamily: "'Montserrat', sans-serif",
        fontHeading: "'Montserrat', sans-serif",
        fontBody: "'Montserrat', sans-serif"
    },
    landing: {
        id: 'landing',
        name: 'Landing Page Classic',
        primary: '#00efff',
        secondary: '#00d4ff',
        accent: '#0ef',
        background: '#081b29',
        surface: '#0f2438',
        text: '#ededed',
        textSecondary: '#b0b0b0',
        border: 'rgba(0, 239, 255, 0.2)',
        gradient: 'linear-gradient(135deg, #00efff 0%, #00d4ff 100%)',
        fontFamily: "'Poppins', sans-serif",
        fontHeading: "'Poppins', sans-serif",
        fontBody: "'Poppins', sans-serif"
    },
    darkPure: {
        id: 'darkPure',
        name: 'Pure Dark',
        primary: '#ffffff',
        secondary: '#f3f4f6',
        accent: '#e5e7eb',
        background: '#000000',
        surface: '#0a0a0a',
        text: '#ffffff',
        textSecondary: '#9ca3af',
        border: 'rgba(255, 255, 255, 0.1)',
        gradient: 'linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%)',
        fontFamily: "'Inter', sans-serif",
        fontHeading: "'Inter', sans-serif",
        fontBody: "'Inter', sans-serif"
    },
    neon: {
        id: 'neon',
        name: 'Neon Glow',
        primary: '#ff00ff',
        secondary: '#00ffff',
        accent: '#ffff00',
        background: '#0a0014',
        surface: '#1a0028',
        text: '#ffffff',
        textSecondary: '#e0e0ff',
        border: 'rgba(255, 0, 255, 0.3)',
        gradient: 'linear-gradient(135deg, #ff00ff 0%, #00ffff 100%)',
        fontFamily: "'Orbitron', sans-serif",
        fontHeading: "'Orbitron', sans-serif",
        fontBody: "'Space Grotesk', sans-serif"
    },
    gradient: {
        id: 'gradient',
        name: 'Rainbow Gradient',
        primary: '#667eea',
        secondary: '#764ba2',
        accent: '#f093fb',
        background: '#0f0c29',
        surface: '#1a1541',
        text: '#ffffff',
        textSecondary: '#d4c5f9',
        border: 'rgba(102, 126, 234, 0.2)',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        fontFamily: "'Montserrat', sans-serif",
        fontHeading: "'Montserrat', sans-serif",
        fontBody: "'Montserrat', sans-serif"
    },
    hacker: {
        id: 'hacker',
        name: 'Hacker Terminal',
        primary: '#00ff00',
        secondary: '#00cc00',
        accent: '#00ff41',
        background: '#000000',
        surface: '#0a0a0a',
        text: '#00ff00',
        textSecondary: '#00cc00',
        border: 'rgba(0, 255, 0, 0.2)',
        gradient: 'linear-gradient(135deg, #00ff00 0%, #00cc00 100%)',
        fontFamily: "'Fira Code', monospace",
        fontHeading: "'Rajdhani', sans-serif",
        fontBody: "'Fira Code', monospace"
    },
    sunset: {
        id: 'sunset',
        name: 'Sunset Paradise',
        primary: '#ff6b6b',
        secondary: '#ffd93d',
        accent: '#ff9f43',
        background: '#1a0f0a',
        surface: '#2d1810',
        text: '#fff5eb',
        textSecondary: '#ffcaa0',
        border: 'rgba(255, 107, 107, 0.2)',
        gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ffd93d 100%)',
        fontFamily: "'Poppins', sans-serif",
        fontHeading: "'Poppins', sans-serif",
        fontBody: "'Poppins', sans-serif"
    },
    fancyDark: {
        id: 'fancyDark',
        name: 'Fancy Dark',
        primary: '#00ff88',
        secondary: '#00ffea',
        accent: '#ff00ff',
        background: '#0a0a0f',
        surface: '#14141f',
        text: '#ffffff',
        textSecondary: '#a0a0b0',
        border: 'rgba(0, 255, 136, 0.2)',
        gradient: 'linear-gradient(135deg, #00ff88 0%, #00ffea 50%, #ff00ff 100%)',
        fontFamily: "'Space Grotesk', 'Rajdhani', sans-serif",
        fontHeading: "'Rajdhani', sans-serif",
        fontBody: "'Space Grotesk', sans-serif"
    }
};

export const ThemeProvider = ({ children }) => {
    const [currentTheme, setCurrentTheme] = useState(() => {
        const saved = localStorage.getItem('efolio-theme');
        return saved || 'cyber';
    });

    // Merge existing themes with new theme presets
    const allThemes = { ...themes, ...themePresets };
    const theme = allThemes[currentTheme] || themes.cyber;

    useEffect(() => {
        localStorage.setItem('efolio-theme', currentTheme);
        
        // Apply theme to document
        document.documentElement.style.setProperty('--primary-color', theme.primary);
        document.documentElement.style.setProperty('--secondary-color', theme.secondary);
        document.documentElement.style.setProperty('--accent-color', theme.accent);
        document.documentElement.style.setProperty('--bg-color', theme.background);
        document.documentElement.style.setProperty('--surface-color', theme.surface);
        document.documentElement.style.setProperty('--text-color', theme.text);
        document.documentElement.style.setProperty('--text-secondary', theme.textSecondary);
        document.documentElement.style.setProperty('--border-color', theme.border);
        document.documentElement.style.setProperty('--gradient', theme.gradient);
        document.body.style.fontFamily = theme.fontBody;
        
        // Update Tailwind CSS custom properties
        const root = document.documentElement;
        root.style.setProperty('--theme-primary', theme.primary);
        root.style.setProperty('--theme-background', theme.background);
        root.style.setProperty('--theme-text', theme.text);
        
    }, [currentTheme, theme]);

    const changeTheme = (themeId) => {
        if (allThemes[themeId]) {
            setCurrentTheme(themeId);
        }
    };

    const value = {
        currentTheme,
        theme,
        themes: Object.values(allThemes).map(t => ({
            ...t,
            id: t.id || Object.keys(allThemes).find(key => allThemes[key] === t)
        })),
        changeTheme
    };

    return (
        <ThemeContext.Provider value={value}>
            <div 
                style={{
                    backgroundColor: theme.background,
                    color: theme.text,
                    minHeight: '100vh',
                    fontFamily: theme.fontBody
                }}
            >
                {children}
            </div>
        </ThemeContext.Provider>
    );
};

export default ThemeProvider;
