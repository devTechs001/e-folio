import { useEffect, useState } from 'react';
import { useSocket } from '../contexts/SocketContext';

export const useSettingsListener = () => {
    const [settings, setSettings] = useState(null);
    let socket, connected;
    try {
        const ctx = useSocket();
        socket = ctx.socket;
        connected = ctx.connected;
    } catch {
        socket = null;
        connected = false;
    }

    useEffect(() => {
        // Listen for window events (for local component communication)
        const handleSettingsChange = (event) => {
            setSettings(event.detail);
        };

        // Listen for socket events (for real-time cross-device updates)
        const handleSocketSettingsUpdate = (data) => {
            console.log('Settings updated via socket:', data);
            setSettings(data.settings);
        };

        window.addEventListener('settingsChanged', handleSettingsChange);
        
        // Add socket listeners if connected
        if (socket && connected) {
            socket.on('settings:updated', handleSocketSettingsUpdate);
        }

        return () => {
            window.removeEventListener('settingsChanged', handleSettingsChange);
            if (socket) {
                socket.off('settings:updated', handleSocketSettingsUpdate);
            }
        };
    }, [socket, connected]);

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
