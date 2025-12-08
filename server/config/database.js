const mongoose = require('mongoose');

const connectDB = async () => {
    // Define connection URIs
    const atlasURI = process.env.MONGODB_URI;  // Atlas connection string from environment
    const localURI = 'mongodb://localhost:27017/efolio';  // Local fallback
    
    // Common connection options
    const options = {
        serverSelectionTimeoutMS: 10000,  // Increased timeout for cloud connections
        socketTimeoutMS: 45000,
        maxPoolSize: 10,                  // Maintain up to 10 socket connections
    };

    // Try Atlas connection first (if URI is provided)
    if (atlasURI) {
        try {
            console.log('📡 Attempting connection to MongoDB Atlas...');
            const atlasConn = await mongoose.connect(atlasURI, options);
            
            console.log(`✅ MongoDB Atlas Connected: ${atlasConn.connection.host}`);
            console.log(`📁 Database: ${atlasConn.connection.name}`);
            
            // Handle Atlas connection events
            mongoose.connection.on('error', (err) => {
                console.error('❌ MongoDB Atlas connection error:', err);
            });

            mongoose.connection.on('disconnected', () => {
                console.warn('⚠️  MongoDB Atlas disconnected, attempting reconnection...');
            });

            mongoose.connection.on('reconnected', () => {
                console.log('✅ MongoDB Atlas reconnected');
            });

            return atlasConn;
        } catch (atlasError) {
            console.error('❌ MongoDB Atlas connection failed:', atlasError.message);
            console.log('⚠️  Attempting fallback to local MongoDB...');
            
            // If Atlas fails, try local connection
            return await attemptLocalConnection();
        }
    } else {
        // If no Atlas URI provided, connect to local
        console.log('📡 No Atlas URI provided, attempting local MongoDB connection...');
        return await attemptLocalConnection();
    }
};

// Separate function for local connection
const attemptLocalConnection = async () => {
    const localURI = 'mongodb://localhost:27017/efolio';
    const localOptions = {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    };

    try {
        const localConn = await mongoose.connect(localURI, localOptions);
        
        console.log(`✅ Local MongoDB Connected: ${localConn.connection.host}`);
        console.log(`📁 Database: ${localConn.connection.name}`);
        
        // Handle local connection events
        mongoose.connection.on('error', (err) => {
            console.error('❌ Local MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️  Local MongoDB disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('✅ Local MongoDB reconnected');
        });

        return localConn;
    } catch (localError) {
        console.error('❌ Local MongoDB connection failed:', localError.message);
        console.log('⚠️  Running in memory mode (no database persistence)');
        console.log('💡 Tip: Make sure MongoDB is running locally or configure MONGODB_URI for Atlas');
        
        // Don't exit process - allow server to run without database
        return null;
    }
};

module.exports = connectDB;
