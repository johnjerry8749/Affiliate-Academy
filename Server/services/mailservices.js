import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.APP_PASSWORD,
    },
});

// Function to replace template variables
const replaceTemplateVariables = (template, subject, message, name) => {
    return template
        .replace(/{{subject}}/g, subject)
        .replace(/{{message}}/g, message)
        .replace(/{{name}}/g, name || "Valued Member");
};

export const sendMail = async (req, res) => {
    const { to, subject, message, name } = req.body;
    
    if (!to || !subject || !message) {
        return res.status(400).json({ error: 'Missing email details' });
    }

    try {
        // Read template fresh each time to get latest version
        const templatePath = path.join(__dirname, '../template/adminMail.html');
        const htmlTemplate = fs.readFileSync(templatePath, 'utf-8');
        
        // Replace template variables
        const emailHtml = replaceTemplateVariables(htmlTemplate, subject, message, name);

        await transporter.sendMail({
            from: `"Affiliate Academy" <${process.env.GMAIL_USER}>`,
            to,
            subject,
            html: emailHtml,
        });

        console.log(`📧 Email sent successfully to: ${to}`);
        console.log(`📋 Email details:`, {
            to,
            subject,
            name: name || 'Not specified',
            timestamp: new Date().toISOString()
        });
        
        res.json({ success: true, message: 'Email sent successfully' });
    } catch (error) {
        console.error('❌ Email sending error:', error);
        res.status(500).json({ error: 'Failed to send email', details: error.message });
    }
};

// Standalone function to send emails programmatically (without req/res)
export const sendEmailDirect = async ({ to, subject, message, name }) => {
    try {
        const templatePath = path.join(__dirname, '../template/adminMail.html');
        const htmlTemplate = fs.readFileSync(templatePath, 'utf-8');
        
        const emailHtml = replaceTemplateVariables(htmlTemplate, subject, message, name);

        const info = await transporter.sendMail({
            from: `"Affiliate Academy" <${process.env.GMAIL_USER}>`,
            to,
            subject,
            html: emailHtml,
        });

        console.log('✅ Direct email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error sending direct email:', error);
        throw error;
    }
};
