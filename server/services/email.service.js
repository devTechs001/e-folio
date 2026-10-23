const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    async send({ to, subject, template, data }) {
        try {
            if (!process.env.SMTP_USER || process.env.SMTP_USER === 'your_email@gmail.com') {
                console.log('📧 Email simulation (SMTP not configured):', { to, subject, template });
                return { success: true, simulated: true, messageId: `sim_${Date.now()}` };
            }

            // Load email template
            const templatePath = path.join(__dirname, '../templates/emails', `${template}.html`);
            const templateSource = await fs.readFile(templatePath, 'utf-8');
            const compiledTemplate = handlebars.compile(templateSource);
            const html = compiledTemplate(data);

            // Send email
            const info = await this.transporter.sendMail({
                from: process.env.EMAIL_FROM || 'noreply@portfolio.com',
                to,
                subject,
                html
            });

            console.log('Email sent:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Email send error:', error);
            return { success: false, error: error.message };
        }
    }
}

const emailService = new EmailService();

const sendEmail = async (options) => {
    if (options.template) {
        return emailService.send(options);
    }
    const { sendEmail: rawSendEmail } = require('../utils/email');
    return rawSendEmail(options);
};

module.exports = emailService;
module.exports.sendEmail = sendEmail;
module.exports.EmailService = EmailService;