const nodemailer = require('nodemailer');

const getTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};

const sendEmail = async ({ to, cc, bcc, subject, html, attachments }) => {
    try {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS || process.env.SMTP_USER === 'your_email@gmail.com') {
            // A simulated send is NOT a delivery. Returning success:true here
            // made approval flows report "invitation sent" when nothing left
            // the process. Callers now surface the failure to the operator.
            console.warn('[email] SMTP not configured; message was not delivered:', { to, subject });
            return {
                success: false,
                simulated: true,
                reason: 'SMTP_NOT_CONFIGURED',
                message: 'Email transport is not configured'
            };
        }
        const transporter = getTransporter();
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || 'noreply@portfolio.com',
            to,
            cc,
            bcc,
            subject,
            html,
            attachments
        });
        console.log('Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Email send error:', error);
        return { success: false, error: error.message };
    }
};

module.exports = { sendEmail };
