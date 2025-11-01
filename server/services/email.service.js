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

module.exports = new EmailService();