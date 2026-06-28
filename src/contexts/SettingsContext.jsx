import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiService from '../services/api.service';
import { useSocket } from './SocketContext';
import cacheService from '../services/cache.service';

const SettingsContext = createContext(null);
const CACHE_KEY = 'app_settings';
const CACHE_TTL = 5 * 60 * 1000;

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) throw new Error('useSettings must be used within SettingsProvider');
    return context;
};

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isDirty, setIsDirty] = useState(false);
    const [lastSynced, setLastSynced] = useState(null);
    const socket = useSocket();

    const fetchSettings = useCallback(async () => {
        try {
            const cached = cacheService.get(CACHE_KEY);
            if (cached) {
                setSettings(cached);
                setLoading(false);
                return;
            }
            const res = await apiService.getSettings();
            if (res?.success && res?.data) {
                setSettings(res.data);
                cacheService.set(CACHE_KEY, res.data, CACHE_TTL);
                window.dispatchEvent(new CustomEvent('settingsChanged', { detail: res.data }));
            }
        } catch (err) {
            if (err?.message !== 'Not authorized to access this route') {
                console.warn('Failed to fetch settings:', err);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    const updateSettings = useCallback(async (newSettings) => {
        try {
            const res = await apiService.updateSettings(newSettings);
            if (res?.success) {
                setSettings(prev => ({ ...prev, ...newSettings }));
                cacheService.set(CACHE_KEY, { ...settings, ...newSettings }, CACHE_TTL);
                setIsDirty(false);
                setLastSynced(new Date());
                window.dispatchEvent(new CustomEvent('settingsChanged', { detail: { ...settings, ...newSettings } }));
                if (socket?.connected) {
                    socket.emit('settings:update', { ...settings, ...newSettings });
                }
            }
        } catch (err) {
            console.error('Failed to update settings:', err);
        }
    }, [settings, socket]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    useEffect(() => {
        if (!socket) return;
        const handleSettingsUpdate = (data) => {
            setSettings(data);
            cacheService.set(CACHE_KEY, data, CACHE_TTL);
            setLastSynced(new Date());
            window.dispatchEvent(new CustomEvent('settingsChanged', { detail: data }));
        };
        socket.on('settings:updated', handleSettingsUpdate);
        return () => socket.off('settings:updated', handleSettingsUpdate);
    }, [socket]);

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, loading, isDirty, lastSynced }}>
            {children}
        </SettingsContext.Provider>
    );
};
