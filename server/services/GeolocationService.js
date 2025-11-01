// services/GeoLocationService.js
const axios = require('axios');

class GeoLocationService {
    static async getLocation(ip) {
        try {
            // Use a free IP geolocation service
            // You can replace this with ipapi.co, ipgeolocation.io, or MaxMind
            const response = await axios.get(`http://ip-api.com/json/${ip}`);
            
            if (response.data.status === 'success') {
                return {
                    country: response.data.country,
                    city: response.data.city,
                    region: response.data.regionName,
                    latitude: response.data.lat,
                    longitude: response.data.lon,
                    timezone: response.data.timezone
                };
            }
        } catch (error) {
            console.error('GeoLocation error:', error);
        }

        // Fallback
        return {
            country: 'Unknown',
            city: 'Unknown',
            region: 'Unknown',
            latitude: null,
            longitude: null,
            timezone: null
        };
    }
}

module.exports = GeoLocationService;