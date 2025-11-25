import express from 'express';
const mailRouter = express.Router();

import { sendMail, sendEmailDirect } from '../services/mailservices.js';

// Test endpoint to verify email configuration
mailRouter.get('/test', async (req, res) => {
  try {
    await sendEmailDirect({
      to: process.env.GMAIL_USER,
      subject: 'Test Email - Affiliate Academy',
      message: 'This is a test email to verify your Gmail configuration is working correctly. If you receive this, your email service is properly configured!',
      name: 'System Test'
    });
    res.json({ success: true, message: 'Test email sent successfully!' });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Test email failed', 
      details: error.message 
    });
  }
});

// Endpoint for admin to send emails
mailRouter.post('/admin/send-mail', sendMail);

// Public endpoint for sending emails (used by crypto payment notifications)
mailRouter.post('/send', sendMail);

export default mailRouter;