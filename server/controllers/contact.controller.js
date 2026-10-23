// controllers/contact.controller.js
const nodemailer = require('nodemailer');
const ContactForm = require('../models/ContactForm.model');

// Create email transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER || process.env.EMAIL_FROM,
            pass: process.env.SMTP_PASS
        }
    });
};

// Send contact form message
exports.sendContactMessage = async (req, res) => {
    try {
        const { name, email, phone, subject, message, preferredContact, company, budget, serviceType } = req.body;

        // Validate required fields
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'Please fill in all required fields'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid email address'
            });
        }

        // Save contact message to database
        try {
            await ContactForm.create({
                name,
                email,
                phone,
                subject,
                message,
                company,
                budget,
                serviceType,
                source: 'website',
                ip: req.ip || req.connection?.remoteAddress,
                userAgent: req.get('user-agent')
            });
        } catch (dbErr) {
            console.warn('Could not persist contact form to database:', dbErr.message);
        }

        // Check if SMTP is configured
        if (process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_USER !== 'your_email@gmail.com') {
            try {
                const transporter = createTransporter();

                // Create email content
                const emailContent = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                            <h2 style="color: #333; margin-bottom: 20px;">New Contact Form Submission</h2>
                            <div style="margin-bottom: 20px;">
                                <p style="margin: 5px 0;"><strong>Name:</strong> ${name}</p>
                                <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
                                <p style="margin: 5px 0;"><strong>Phone:</strong> ${phone || 'Not provided'}</p>
                                <p style="margin: 5px 0;"><strong>Preferred Contact:</strong> ${preferredContact || 'email'}</p>
                            </div>
                            <div style="margin-bottom: 20px;">
                                <h3 style="color: #555; margin-bottom: 10px;">Message:</h3>
                                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #007bff;">
                                    <p style="margin: 0; white-space: pre-wrap;">${message}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                await transporter.sendMail({
                    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
                    to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
                    subject: `Portfolio Contact: ${subject}`,
                    html: emailContent,
                    replyTo: email
                });
            } catch (mailErr) {
                console.warn('SMTP sending error, message was stored in database:', mailErr.message);
            }
        } else {
            console.log('📧 Contact form received and stored (SMTP credentials placeholder):', { name, email, subject });
        }

        res.status(200).json({
            success: true,
            message: 'Message sent successfully! I will get back to you soon.'
        });

    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message. Please try again or contact directly via email.'
        });
    }
};
