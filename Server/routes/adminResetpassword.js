import { supabase } from "../utils/supabaseClient.js";
import express from 'express';
import bcrypt from "bcryptjs";
import crypto from 'crypto';

const adminReset = express.Router();
import { sendResetEmail } from "../services/AmdminResetMail.js";

adminReset.post('/admin/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });

    try {
        // 1. Find admin
        // use `admins` table (consistent with other controllers)
        const { data: admin, error } = await supabase
            .from('admins')
            .select('id,email')
            .eq('email', email)
            .single();

        if (error || !admin) {
            // Do NOT reveal if email exists → security
            return res.json({ message: 'If the email exists, a reset link was sent.' });
        }

        // 2. Generate secure token (32 bytes → 64 hex)
        const token = crypto.randomBytes(32).toString('hex');

        // 3. Store token + expiry (15 min)
        const expires = new Date(Date.now() + 15 * 60 * 1000);
        const { error: updErr } = await supabase
            .from('admins')
            .update({
                reset_token: token,
                reset_expires: expires.toISOString(),
            })
            .eq('id', admin.id);

        if (updErr) throw updErr;
        console.log('proceeding to sending mail')

        // 4. Build reset URL (your frontend)
        const frontendUrl =
            process.env.FRONTEND_URL || "http://localhost:5173"; // <-- add your dev URL here

        const resetUrl = `${frontendUrl}admin/reset-password?token=${token}`;
        
        // DEBUG: log the reset URL being sent
        console.log('Reset link being sent:', resetUrl);

        // 5. Send email (nodemailer, sendgrid, etc.)
        await sendResetEmail(admin.email, resetUrl);

        res.json({ message: 'If the email exists, a reset link was sent.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

adminReset.post('/admin/reset-password', async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: 'Token & password required' });

    try {
        // lookup in `admins` table and use column names consistent with adminAuth
        const { data: admin, error } = await supabase
            .from('admins')
            .select('id, reset_token, reset_expires')
            .eq('reset_token', token)
            .single();

        if (error || !admin) return res.status(400).json({ message: 'Invalid or expired token' });

        if (new Date(admin.reset_expires) < new Date()) {
            return res.status(400).json({ message: 'Token expired' });
        }

        // Hash new password
        const newPasswordHash = await bcrypt.hash(password, 12);

        // Update password + clear token in `admins` table
        // many parts of the codebase store the hashed password in `password`
        const { error: updErr } = await supabase
            .from('admins')
            .update({
                password: newPasswordHash,
                reset_token: null,
                reset_expires: null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', admin.id);

        if (updErr) throw updErr;

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

export default adminReset;