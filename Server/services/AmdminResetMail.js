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
    subject: "Admin Password Reset",
    html: `
      <div style="
        max-width: 460px;
        margin: auto;
        background: #ffffff;
        padding: 32px;
        border-radius: 12px;
        font-family: Arial, sans-serif;
        color: #333;
        border: 1px solid #e6e6e6;
      ">
        
        <h2 style="margin-bottom: 16px; color: #111; text-align: center;">
          Reset Your Password
        </h2>

        <p style="font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
          You requested to reset your password. Click the button below to continue.
          <br><br>
          <strong>This link expires in 15 minutes.</strong>
        </p>

        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${url}" 
            style="
              display: inline-block;
              padding: 14px 28px;
              background: #000;
              color: #fff;
              border-radius: 8px;
              text-decoration: none;
              font-weight: bold;
              font-size: 15px;
            ">
            Reset Password
          </a>
        </div>

        <p style="font-size: 14px; color: #666; line-height: 1.6;">
          If you did not request this password reset, you can safely ignore this email.
        </p>

      </div>
    `,
  });
}
