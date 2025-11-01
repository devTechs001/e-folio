// jobs/sendScheduledEmails.js
const cron = require('node-cron');
const ScheduledEmail = require('../models/ScheduledEmail');
const { sendEmail } = require('../utils/email');

// Run every minute
cron.schedule('* * * * *', async () => {
    try {
        const now = new Date();
        
        const scheduledEmails = await ScheduledEmail.find({
            scheduledFor: { $lte: now },
            sent: false
        });

        for (const email of scheduledEmails) {
            try {
                await sendEmail({
                    to: email.to,
                    cc: email.cc,
                    bcc: email.bcc,
                    subject: email.subject,
                    html: email.body,
                    attachments: email.attachments
                });

                email.sent = true;
                email.sentAt = new Date();
                await email.save();

                console.log(`Sent scheduled email: ${email._id}`);
            } catch (error) {
                console.error(`Failed to send scheduled email ${email._id}:`, error);
            }
        }
    } catch (error) {
        console.error('Scheduled emails cron error:', error);
    }
});

module.exports = cron;