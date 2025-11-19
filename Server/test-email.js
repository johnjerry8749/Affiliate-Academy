// Quick test script for email functionality
import dotenv from 'dotenv';
import { sendEmailDirect } from './services/mailservices.js';

dotenv.config();

console.log('🧪 Testing email configuration...\n');
console.log('Gmail User:', process.env.GMAIL_USER);
console.log('App Password:', process.env.APP_PASSWORD ? '✅ Set' : '❌ Missing');
console.log('\n📧 Sending test email...\n');

sendEmailDirect({
  to: process.env.GMAIL_USER, // Send to yourself
  subject: 'Test Referral Email - Affiliate Academy 💰',
  message: 'Great news! John Doe just registered using your referral link. You\'ve earned ₦2,500 in commissions! Your commission breakdown: ₦500 commission + ₦2,000 balance. The amount has been added to your account and is available for withdrawal. Keep sharing your referral link to earn more!',
  name: 'Test User'
})
.then((result) => {
  console.log('✅ SUCCESS! Email sent:', result.messageId);
  console.log('\n📬 Check your inbox:', process.env.GMAIL_USER);
  process.exit(0);
})
.catch((error) => {
  console.error('❌ FAILED! Error:', error.message);
  console.error('\nFull error:', error);
  process.exit(1);
});
