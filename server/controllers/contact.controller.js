// controllers/contact.controller.js
const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
    return nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
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
        const { name, email, phone, subject, message, preferredContact } = req.body;

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

        // Create email content
        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #333; margin-bottom: 20px;">New Contact Form Submission</h2>
                    
                    <div style="margin-bottom: 20px;">
                        <h3 style="color: #555; margin-bottom: 10px;">Contact Information:</h3>
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
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p style="margin: 0; color: #666; font-size: 12px;">
                            This message was sent from your portfolio contact form on ${new Date().toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>
        `;

        // Create transporter
        const transporter = createTransporter();

        // Send email to admin
        const adminMailOptions = {
            from: process.env.EMAIL_FROM || process.env.SMTP_USER,
            to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
            subject: `Portfolio Contact: ${subject}`,
            html: emailContent,
            replyTo: email
        };

        // Send confirmation email to sender
        const confirmationMailOptions = {
            from: process.env.EMAIL_FROM || process.env.SMTP_USER,
            to: email,
            subject: 'Thank you for contacting me!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                    <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h2 style="color: #333; margin-bottom: 20px;">Thank You for Contacting Me!</h2>
                        
                        <p style="color: #666; margin-bottom: 20px;">
                            Hi ${name},<br><br>
                            Thank you for reaching out through my portfolio. I have received your message and will get back to you as soon as possible.
                        </p>
                        
                        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                            <h4 style="color: #555; margin: 0 0 10px 0;">Your Message Summary:</h4>
                            <p style="margin: 5px 0;"><strong>Subject:</strong> ${subject}</p>
                            <p style="margin: 5px 0;"><strong>Preferred Contact:</strong> ${preferredContact || 'email'}</p>
                        </div>
                        
                        <p style="color: #666; margin-bottom: 20px;">
                            I typically respond within 24 hours. If you need immediate assistance, feel free to reach out through the other contact methods listed on my portfolio.
                        </p>
                        
                        <div style="text-align: center; margin-top: 30px;">
                            <a href="${process.env.PORTFOLIO_URL || 'http://localhost:5173'}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                Visit My Portfolio
                            </a>
                        </div>
                        
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                            <p style="margin: 0; color: #666; font-size: 12px; text-align: center;">
                                This is an automated message. Please do not reply to this email.
                            </p>
                        </div>
                    </div>
                </div>
            `
        };

        // Send both emails
        await Promise.all([
            transporter.sendMail(adminMailOptions),
            transporter.sendMail(confirmationMailOptions)
        ]);

        res.status(200).json({
            success: true,
            message: 'Message sent successfully! I will get back to you soon.'
        });

    } catch (error) {
        console.error('Contact form error:', error);
        
        // Check if it's an email configuration error
        if (error.code === 'EAUTH' || error.code === 'ECONNECTION') {
            return res.status(500).json({
                success: false,
                message: 'Email service is currently unavailable. Please try again later or contact directly via email.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to send message. Please try again or contact directly via email.'
        });
    }
};
