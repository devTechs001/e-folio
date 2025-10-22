import { createContext, useContext, useState, useEffect } from 'react';

const LandingPageThemeContext = createContext(undefined);

export const useLandingPageTheme = () => {
    const context = useContext(LandingPageThemeContext);
    if (!context) {
        throw new Error('useLandingPageTheme must be used within LandingPageThemeProvider');
    }
    return context;
};

// Landing Page Specific Themes
export const landingPageThemes = {
    cyber: {
        id: 'cyber',
        name: 'Cyber Neon',
        bgColor: '#081b29',
        sbgColor: '#112e42',
        mainColor: '#00efff',
        textColor: '#ededed',
        gradient: 'linear-gradient(135deg, #00efff, #00d4ff)',
        pattern: 'cyber-grid'
    },
    sunset: {
        id: 'sunset',
        name: 'Sunset Vibes',
        bgColor: '#1a0a2e',
        sbgColor: '#2d1b4e',
        mainColor: '#ff6b6b',
        textColor: '#f0f0f0',
        gradient: 'linear-gradient(135deg, #ff6b6b, #ee5a6f)',
        pattern: 'wave'
    },
    forest: {
        id: 'forest',
        name: 'Forest Green',
        bgColor: '#0d1b2a',
        sbgColor: '#1b263b',
        mainColor: '#52b788',
        textColor: '#e0fbfc',
        gradient: 'linear-gradient(135deg, #52b788, #40916c)',
        pattern: 'hexagon'
    },
    purple: {
        id: 'purple',
        name: 'Purple Dream',
        bgColor: '#0f0a1e',
        sbgColor: '#1e1537',
        mainColor: '#a855f7',
        textColor: '#f3e8ff',
        gradient: 'linear-gradient(135deg, #a855f7, #8b5cf6)',
        pattern: 'dots'
    },
    ocean: {
        id: 'ocean',
        name: 'Ocean Blue',
        bgColor: '#03045e',
        sbgColor: '#023e8a',
        mainColor: '#0096c7',
        textColor: '#caf0f8',
        gradient: 'linear-gradient(135deg, #0096c7, #00b4d8)',
        pattern: 'wave'
    },
    sunset_orange: {
        id: 'sunset_orange',
        name: 'Sunset Orange',
        bgColor: '#1a1423',
        sbgColor: '#2b2033',
        mainColor: '#ff9f1c',
        textColor: '#fff1e6',
        gradient: 'linear-gradient(135deg, #ff9f1c, #ff6b35)',
        pattern: 'geometric'
    }
};

export const LandingPageThemeProvider = ({ children }) => {
    const [currentTheme, setCurrentTheme] = useState(() => {
        return localStorage.getItem('landingPageTheme') || 'cyber';
    });
    
    const [autoChange, setAutoChange] = useState(() => {
        return localStorage.getItem('autoChangeTheme') === 'true';
    });

    const [theme, setTheme] = useState(landingPageThemes[currentTheme]);

    // Auto-change theme every 30 seconds if enabled
    useEffect(() => {
        if (!autoChange) return;

        const interval = setInterval(() => {
            const themeKeys = Object.keys(landingPageThemes);
            const currentIndex = themeKeys.indexOf(currentTheme);
            const nextIndex = (currentIndex + 1) % themeKeys.length;
            const nextTheme = themeKeys[nextIndex];
            
            changeTheme(nextTheme);
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [autoChange, currentTheme]);

    // Apply theme to CSS variables
    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--bgColor', theme.bgColor);
        root.style.setProperty('--sbgColor', theme.sbgColor);
        root.style.setProperty('--mainColor', theme.mainColor);
        root.style.setProperty('--textColor', theme.textColor);
        
        // Save to localStorage
        localStorage.setItem('landingPageTheme', theme.id);
    }, [theme]);

    const changeTheme = (themeId) => {
        if (landingPageThemes[themeId]) {
            setCurrentTheme(themeId);
            setTheme(landingPageThemes[themeId]);
        }
    };

    const toggleAutoChange = () => {
        const newValue = !autoChange;
        setAutoChange(newValue);
        localStorage.setItem('autoChangeTheme', newValue.toString());
    };

    const value = {
        theme,
        currentTheme,
        autoChange,
        changeTheme,
        toggleAutoChange,
        availableThemes: Object.values(landingPageThemes)
    };

    return (
        <LandingPageThemeContext.Provider value={value}>
            {children}
        </LandingPageThemeContext.Provider>
    );
};

export default LandingPageThemeProvider;
