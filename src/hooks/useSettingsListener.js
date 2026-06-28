import { useEffect, useState } from 'react';

export const useSettingsListener = () => {
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        const handleSettingsChange = (event) => {
            setSettings(event.detail);
        };

        window.addEventListener('settingsChanged', handleSettingsChange);

        return () => {
            window.removeEventListener('settingsChanged', handleSettingsChange);
        };
    }, []);

    return settings;
};

export const useSettingsValue = (key, defaultValue) => {
    const [value, setValue] = useState(defaultValue);
    const settings = useSettingsListener();

    useEffect(() => {
        if (settings && settings[key] !== undefined) {
            setValue(settings[key]);
        }
    }, [settings, key]);

    return value;
};
