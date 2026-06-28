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
