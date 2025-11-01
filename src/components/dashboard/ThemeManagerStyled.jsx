// client/src/contexts/ThemeContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

// Comprehensive theme collection
const themeCollection = {
    // PROFESSIONAL THEMES
    professional: [
        {
            id: 'corporate-blue',
            name: 'Corporate Blue',
            category: 'professional',
            type: 'dark',
            colors: {
                primary: '#0ea5e9',
                secondary: '#38bdf8',
                accent: '#7dd3fc',
                background: '#0f172a',
                surface: '#1e293b',
                text: '#f1f5f9',
                textSecondary: '#94a3b8',
                border: '#334155',
                success: '#10b981',
                warning: '#f59e0b',
                error: '#ef4444',
                info: '#3b82f6'
            },
            gradient: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)',
            fonts: {
                heading: "'Inter', sans-serif",
                body: "'Inter', sans-serif",
                mono: "'Fira Code', monospace"
            }
        },
        {
            id: 'midnight-professional',
            name: 'Midnight Pro',
            category: 'professional',
            type: 'dark',
            colors: {
                primary: '#6366f1',
                secondary: '#818cf8',
                accent: '#a5b4fc',
                background: '#0a0a0f',
                surface: '#1a1a2e',
                text: '#f8fafc',
                textSecondary: '#94a3b8',
                border: '#2d3748',
                success: '#22c55e',
                warning: '#fbbf24',
                error: '#f87171',
                info: '#60a5fa'
            },
            gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            fonts: {
                heading: "'Outfit', sans-serif",
                body: "'Inter', sans-serif",
                mono: "'JetBrains Mono', monospace"
            }
        },
        {
            id: 'slate-minimal',
            name: 'Slate Minimal',
            category: 'professional',
            type: 'dark',
            colors: {
                primary: '#64748b',
                secondary: '#94a3b8',
                accent: '#cbd5e1',
                background: '#0f172a',
                surface: '#1e293b',
                text: '#f1f5f9',
                textSecondary: '#94a3b8',
                border: '#334155',
                success: '#10b981',
                warning: '#f59e0b',
                error: '#ef4444',
                info: '#0ea5e9'
            },
            gradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
            fonts: {
                heading: "'Space Grotesk', sans-serif",
                body: "'Inter', sans-serif",
                mono: "'Source Code Pro', monospace"
            }
        }
    ],

    // CREATIVE THEMES
    creative: [
        {
            id: 'vibrant-sunset',
            name: 'Vibrant Sunset',
            category: 'creative',
            type: 'dark',
            colors: {
                primary: '#f97316',
                secondary: '#fb923c',
                accent: '#fdba74',
                background: '#18181b',
                surface: '#27272a',
                text: '#fafafa',
                textSecondary: '#a1a1aa',
                border: '#3f3f46',
                success: '#22c55e',
                warning: '#eab308',
                error: '#ef4444',
                info: '#3b82f6'
            },
            gradient: 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)',
            fonts: {
                heading: "'Poppins', sans-serif",
                body: "'Inter', sans-serif",
                mono: "'Fira Code', monospace"
            }
        },
        {
            id: 'neon-dreams',
            name: 'Neon Dreams',
            category: 'creative',
            type: 'dark',
            colors: {
                primary: '#ec4899',
                secondary: '#f472b6',
                accent: '#f9a8d4',
                background: '#0f0f23',
                surface: '#1a1a3e',
                text: '#faf5ff',
                textSecondary: '#c4b5fd',
                border: '#4c1d95',
                success: '#10b981',
                warning: '#fbbf24',
                error: '#f43f5e',
                info: '#06b6d4'
            },
            gradient: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
            fonts: {
                heading: "'Montserrat', sans-serif",
                body: "'Inter', sans-serif",
                mono: "'Fira Code', monospace"
            }
        },
        {
            id: 'aurora-borealis',
            name: 'Aurora Borealis',
            category: 'creative',
            type: 'dark',
            colors: {
                primary: '#06b6d4',
                secondary: '#22d3ee',
                accent: '#67e8f9',
                background: '#0c1222',
                surface: '#1a2332',
                text: '#f0f9ff',
                textSecondary: '#93c5fd',
                border: '#1e3a5f',
                success: '#34d399',
                warning: '#fbbf24',
                error: '#f87171',
                info: '#60a5fa'
            },
            gradient: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%)',
            fonts: {
                heading: "'Raleway', sans-serif",
                body: "'Inter', sans-serif",
                mono: "'Fira Code', monospace"
            }
        },
        {
            id: 'cosmic-purple',
            name: 'Cosmic Purple',
            category: 'creative',
            type: 'dark',
            colors: {
                primary: '#a855f7',
                secondary: '#c084fc',
                accent: '#d8b4fe',
                background: '#0f0a1f',
                surface: '#1e1533',
                text: '#faf5ff',
                textSecondary: '#c4b5fd',
                border: '#4c1d95',
                success: '#22c55e',
                warning: '#f59e0b',
                error: '#f43f5e',
                info: '#06b6d4'
            },
            gradient: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
            fonts: {
                heading: "'Orbitron', sans-serif",
                body: "'Inter', sans-serif",
                mono: "'Share Tech Mono', monospace"
            }
        }
    ],

    // NATURE THEMES
    nature: [
        {
            id: 'forest-green',
            name: 'Forest Green',
            category: 'nature',
            type: 'dark',
            colors: {
                primary: '#10b981',
                secondary: '#34d399',
                accent: '#6ee7b7',
                background: '#064e3b',
                surface: '#065f46',
                text: '#f0fdf4',
                textSecondary: '#86efac',
                border: '#047857',
                success: '#22c55e',
                warning: '#fbbf24',
                error: '#f87171',
                info: '#06b6d4'
            },
            gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            fonts: {
                heading: "'Merriweather', serif",
                body: "'Inter', sans-serif",
                mono: "'Courier Prime', monospace"
            }
        },
        {
            id: 'ocean-blue',
            name: 'Ocean Blue',
            category: 'nature',
            type: 'dark',
            colors: {
                primary: '#0284c7',
                secondary: '#0ea5e9',
                accent: '#38bdf8',
                background: '#082f49',
                surface: '#0c4a6e',
                text: '#f0f9ff',
                textSecondary: '#7dd3fc',
                border: '#075985',
                success: '#10b981',
                warning: '#f59e0b',
                error: '#ef4444',
                info: '#06b6d4'
            },
            gradient: 'linear-gradient(135deg, #0284c7 0%, #0891b2 100%)',
            fonts: {
                heading: "'Lora', serif",
                body: "'Inter', sans-serif",
                mono: "'Fira Code', monospace"
            }
        },
        {
            id: 'sunset-orange',
            name: 'Sunset Orange',
            category: 'nature',
            type: 'dark',
            colors: {
                primary: '#ea580c',
                secondary: '#f97316',
                accent: '#fb923c',
                background: '#431407',
                surface: '#7c2d12',
                text: '#fff7ed',
                textSecondary: '#fdba74',
                border: '#9a3412',
                success: '#22c55e',
                warning: '#fbbf24',
                error: '#dc2626',
                info: '#06b6d4'
            },
            gradient: 'linear-gradient(135deg, #ea580c 0%, #dc2626 100%)',
            fonts: {
                heading: "'Playfair Display', serif",
                body: "'Inter', sans-serif",
                mono: "'Fira Code', monospace"
            }
        }
    ],

    // LIGHT THEMES
    light: [
        {
            id: 'clean-white',
            name: 'Clean White',
            category: 'light',
            type: 'light',
            colors: {
                primary: '#3b82f6',
                secondary: '#60a5fa',
                accent: '#93c5fd',
                background: '#ffffff',
                surface: '#f8fafc',
                text: '#0f172a',
                textSecondary: '#64748b',
                border: '#e2e8f0',
                success: '#10b981',
                warning: '#f59e0b',
                error: '#ef4444',
                info: '#06b6d4'
            },
            gradient: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            fonts: {
                heading: "'Inter', sans-serif",
                body: "'Inter', sans-serif",
                mono: "'Fira Code', monospace"
            }
        },
        {
            id: 'soft-lavender',
            name: 'Soft Lavender',
            category: 'light',
            type: 'light',
            colors: {
                primary: '#8b5cf6',
                secondary: '#a78bfa',
                accent: '#c4b5fd',
                background: '#faf5ff',
                surface: '#f3e8ff',
                text: '#1e1b4b',
                textSecondary: '#6b21a8',
                border: '#e9d5ff',
                success: '#10b981',
                warning: '#f59e0b',
                error: '#f43f5e',
                info: '#06b6d4'
            },
            gradient: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
            fonts: {
                heading: "'Quicksand', sans-serif",
                body: "'Inter', sans-serif",
                mono: "'Fira Code', monospace"
            }
        },
        {
            id: 'mint-fresh',
            name: 'Mint Fresh',
            category: 'light',
            type: 'light',
            colors: {
                primary: '#10b981',
                secondary: '#34d399',
                accent: '#6ee7b7',
                background: '#f0fdf4',
                surface: '#dcfce7',
                text: '#064e3b',
                textSecondary: '#047857',
                border: '#bbf7d0',
                success: '#22c55e',
                warning: '#f59e0b',
                error: '#ef4444',
                info: '#06b6d4'
            },
            gradient: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
            fonts: {
                heading: "'Nunito', sans-serif",
                body: "'Inter', sans-serif",
                mono: "'Fira Code', monospace"
            }
        }
    ],

    // RETRO THEMES
    retro: [
        {
            id: 'synthwave',
            name: 'Synthwave',
            category: 'retro',
            type: 'dark',
            colors: {
                primary: '#ff00ff',
                secondary: '#ff1493',
                accent: '#00ffff',
                background: '#1a0033',
                surface: '#2d0066',
                text: '#ffffff',
                textSecondary: '#ff00ff',
                border: '#4d0099',
                success: '#00ff00',
                warning: '#ffff00',
                error: '#ff0000',
                info: '#00ffff'
            },
            gradient: 'linear-gradient(135deg, #ff00ff 0%, #00ffff 100%)',
            fonts: {
                heading: "'Orbitron', sans-serif",
                body: "'Roboto', sans-serif",
                mono: "'VT323', monospace"
            }
        },
        {
            id: 'vaporwave',
            name: 'Vaporwave',
            category: 'retro',
            type: 'dark',
            colors: {
                primary: '#ff6ec7',
                secondary: '#ff71ce',
                accent: '#01cdfe',
                background: '#240041',
                surface: '#36035c',
                text: '#ffffff',
                textSecondary: '#ff6ec7',
                border: '#540082',
                success: '#05ffa1',
                warning: '#fffb96',
                error: '#fe4a49',
                info: '#01cdfe'
            },
            gradient: 'linear-gradient(135deg, #ff6ec7 0%, #01cdfe 100%)',
            fonts: {
                heading: "'Press Start 2P', cursive",
                body: "'Roboto', sans-serif",
                mono: "'VT323', monospace"
            }
        },
        {
            id: 'cyberpunk',
            name: 'Cyberpunk',
            category: 'retro',
            type: 'dark',
            colors: {
                primary: '#fcee09',
                secondary: '#ff2a6d',
                accent: '#05d9e8',
                background: '#000000',
                surface: '#1a1a1a',
                text: '#ffffff',
                textSecondary: '#05d9e8',
                border: '#333333',
                success: '#00ff41',
                warning: '#fcee09',
                error: '#ff2a6d',
                info: '#05d9e8'
            },
            gradient: 'linear-gradient(135deg, #fcee09 0%, #ff2a6d 50%, #05d9e8 100%)',
            fonts: {
                heading: "'Rajdhani', sans-serif",
                body: "'Roboto', sans-serif",
                mono: "'Share Tech Mono', monospace"
            }
        }
    ],

    // MONOCHROME THEMES
    monochrome: [
        {
            id: 'pure-black',
            name: 'Pure Black',
            category: 'monochrome',
            type: 'dark',
            colors: {
                primary: '#ffffff',
                secondary: '#e5e5e5',
                accent: '#cccccc',
                background: '#000000',
                surface: '#1a1a1a',
                text: '#ffffff',
                textSecondary: '#999999',
                border: '#333333',
                success: '#ffffff',
                warning: '#e5e5e5',
                error: '#999999',
                info: '#cccccc'
            },
            gradient: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
            fonts: {
                heading: "'Space Mono', monospace",
                body: "'Roboto Mono', monospace",
                mono: "'Courier Prime', monospace"
            }
        },
        {
            id: 'grayscale',
            name: 'Grayscale',
            category: 'monochrome',
            type: 'dark',
            colors: {
                primary: '#808080',
                secondary: '#999999',
                accent: '#b3b3b3',
                background: '#1a1a1a',
                surface: '#2d2d2d',
                text: '#ffffff',
                textSecondary: '#cccccc',
                border: '#404040',
                success: '#999999',
                warning: '#b3b3b3',
                error: '#666666',
                info: '#808080'
            },
            gradient: 'linear-gradient(135deg, #404040 0%, #808080 100%)',
            fonts: {
                heading: "'Roboto', sans-serif",
                body: "'Roboto', sans-serif",
                mono: "'Roboto Mono', monospace"
            }
        }
    ],

    // HIGH CONTRAST THEMES
    highContrast: [
        {
            id: 'high-contrast-dark',
            name: 'High Contrast Dark',
            category: 'accessibility',
            type: 'dark',
            colors: {
                primary: '#00ffff',
                secondary: '#00ff00',
                accent: '#ffff00',
                background: '#000000',
                surface: '#1a1a1a',
                text: '#ffffff',
                textSecondary: '#00ffff',
                border: '#ffffff',
                success: '#00ff00',
                warning: '#ffff00',
                error: '#ff0000',
                info: '#00ffff'
            },
            gradient: 'linear-gradient(135deg, #00ffff 0%, #00ff00 100%)',
            fonts: {
                heading: "'Arial', sans-serif",
                body: "'Arial', sans-serif",
                mono: "'Courier New', monospace"
            }
        },
        {
            id: 'high-contrast-light',
            name: 'High Contrast Light',
            category: 'accessibility',
            type: 'light',
            colors: {
                primary: '#0000ff',
                secondary: '#0066cc',
                accent: '#0099ff',
                background: '#ffffff',
                surface: '#f0f0f0',
                text: '#000000',
                textSecondary: '#333333',
                border: '#000000',
                success: '#008000',
                warning: '#ff8c00',
                error: '#ff0000',
                info: '#0000ff'
            },
            gradient: 'linear-gradient(135deg, #0000ff 0%, #0066cc 100%)',
            fonts: {
                heading: "'Arial', sans-serif",
                body: "'Arial', sans-serif",
                mono: "'Courier New', monospace"
            }
        }
    ]
};

// Flatten all themes
const allThemes = Object.values(themeCollection).flat();

export const ThemeProvider = ({ children }) => {
    const [currentTheme, setCurrentTheme] = useState(() => {
        return localStorage.getItem('theme') || 'corporate-blue';
    });
    
    const [isDark, setIsDark] = useState(true);
    const [customThemes, setCustomThemes] = useState(() => {
        const saved = localStorage.getItem('customThemes');
        return saved ? JSON.parse(saved) : [];
    });

    const themes = [...allThemes, ...customThemes];
    const theme = themes.find(t => t.id === currentTheme) || themes[0];

    useEffect(() => {
        localStorage.setItem('theme', currentTheme);
        setIsDark(theme.type === 'dark');
    }, [currentTheme, theme]);

    const changeTheme = (themeId) => {
        setCurrentTheme(themeId);
    };

    const addCustomTheme = (customTheme) => {
        const newCustomThemes = [...customThemes, customTheme];
        setCustomThemes(newCustomThemes);
        localStorage.setItem('customThemes', JSON.stringify(newCustomThemes));
    };

    const deleteCustomTheme = (themeId) => {
        const filtered = customThemes.filter(t => t.id !== themeId);
        setCustomThemes(filtered);
        localStorage.setItem('customThemes', JSON.stringify(filtered));
        if (currentTheme === themeId) {
            changeTheme(allThemes[0].id);
        }
    };

    const exportTheme = (themeId) => {
        const themeToExport = themes.find(t => t.id === themeId);
        if (themeToExport) {
            const dataStr = JSON.stringify(themeToExport, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${themeId}-theme.json`;
            link.click();
        }
    };

    const importTheme = (themeData) => {
        addCustomTheme(themeData);
    };

    const value = {
        theme: theme.colors,
        themes,
        themeCollection,
        currentTheme,
        isDark,
        changeTheme,
        addCustomTheme,
        deleteCustomTheme,
        exportTheme,
        importTheme,
        fonts: theme.fonts,
        gradient: theme.gradient,
        themeName: theme.name,
        themeCategory: theme.category
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};