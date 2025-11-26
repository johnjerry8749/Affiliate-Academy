import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   port: Number(process.env.SMTP_PORT),
//   secure: process.env.SMTP_SECURE === 'true',
service: 'Gmail',
  auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.APP_PASSWORD,
    },
});

export async function sendResetEmail(to, url) {
  await transporter.sendMail({
    from: `"Admin Panel" <${process.env.SMTP_FROM || process.env.GMAIL_USER}>`,
    to,
    subject: 'Admin Password Reset',
    html: `
      <h2>Password Reset Request</h2>
      <p>Click the button below to reset your password. The link expires in 15 minutes.</p>
      <a href="${url}" style="display:inline-block;padding:12px 24px;background:#fff;color:#000;border:2px solid #fff;border-radius:8px;text-decoration:none;font-weight:600;">
        Reset Password
      </a>
      <p>If you didn’t request this, ignore this email.</p>
    `,
  });
}