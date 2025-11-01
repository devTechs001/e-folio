const crypto = require('crypto');

// Generate invite token
const generateInviteToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Send email (placeholder - integrate with your email service)
const sendEmail = async (options) => {
    console.log('📧 Email would be sent:', {
        to: options.to,
        subject: options.subject,
        text: options.text?.substring(0, 100) + '...'
    });
    
    // TODO: Integrate with actual email service (SendGrid, Mailgun, etc.)
    return { success: true, message: 'Email sent (simulated)' };
};

module.exports = {
    generateInviteToken,
    sendEmail
};
