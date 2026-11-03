'use strict';
/** Per-user notification preferences and web-push subscriptions. */
const mongoose = require('mongoose');

const notificationPreferenceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    preferences: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        collaboration: { type: Boolean, default: true },
        reviews: { type: Boolean, default: true },
        system: { type: Boolean, default: true },
        marketing: { type: Boolean, default: false }
    },
    updatedAt: { type: Date, default: Date.now }
});

const pushSubscriptionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    endpoint: { type: String, required: true },
    keys: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now }
});
pushSubscriptionSchema.index({ userId: 1, endpoint: 1 }, { unique: true });

module.exports = {
    NotificationPreference: mongoose.model('NotificationPreference', notificationPreferenceSchema),
    PushSubscription: mongoose.model('PushSubscription', pushSubscriptionSchema)
};
