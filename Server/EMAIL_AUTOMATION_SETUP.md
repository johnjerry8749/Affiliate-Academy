# Email Automation Setup - Complete Guide

## ✅ What's Been Implemented

### 1. **Automatic Welcome Email** (New User Registration)
When a new user completes registration and payment:
- ✉️ Sends welcome email automatically
- 📧 Subject: "Welcome to Affiliate Academy! 🎉"
- 📝 Contains: Registration confirmation, login instructions
- 🎯 Sent to: New user's email address

### 2. **Automatic Referral Commission Email** (Referrer Notification)
When someone registers using a referral link:
- ✉️ Sends commission notification to referrer
- 📧 Subject: "New Referral Commission Earned! 💰"
- 💵 Shows: Commission breakdown (₦X commission + ₦Y balance)
- 👤 Mentions: Name of person who registered
- 🎯 Sent to: Referrer's email address

---

## 📁 Files Modified

### 1. **Server/controller/payment.js**
```javascript
// Added imports
import { sendEmailDirect } from '../services/mailservices.js';

// Added welcome email after transaction save
// Added referral commission email after commission distribution
```

**What it does:**
- Sends welcome email to new user after successful payment
- Sends commission notification to referrer when they earn from referral
- Handles email failures gracefully (won't break registration if email fails)

### 2. **Server/services/mailservices.js**
```javascript
// Added new export
export const sendEmailDirect = async ({ to, subject, message, name }) => {...}
```

**What it does:**
- Programmatic email sending (no HTTP request needed)
- Uses the beautiful HTML template we created
- Can be called from anywhere in the backend

### 3. **Server/routes/mail.js**
```javascript
// Added test endpoint
mailRouter.get('/test', async (req, res) => {...});
```

**What it does:**
- Test endpoint to verify email configuration
- Accessible at: `GET http://localhost:5000/api/mail/test`

---

## 🧪 How to Test

### Test 1: Email Service Test
```bash
# Start your server
cd Server
node index.js

# Open browser or use curl
# Visit: http://localhost:5000/api/mail/test
```
**Expected Result:** You receive a test email at your Gmail account

### Test 2: New User Registration Email
1. Go to registration page
2. Fill out form WITHOUT referral code
3. Complete payment
4. **Check email** - you should receive welcome email

### Test 3: Referral Registration Email
1. Create/login as User A
2. Copy User A's referral link
3. Open incognito/new browser
4. Register as User B using User A's referral link
5. Complete payment
6. **Check emails:**
   - User B gets: Welcome email
   - User A gets: Referral commission email

---

## 📧 Email Templates

### Welcome Email Content:
```
Subject: Welcome to Affiliate Academy! 🎉

Hello [User's Name]! 👋

Thank you for joining Affiliate Academy! Your registration has been 
successfully completed. We're excited to have you on board and look 
forward to helping you succeed in your affiliate marketing journey. 
You can now log in to your dashboard and start exploring our programs.

We're here to help you succeed [User's Name]! If you have any questions, 
our support team is ready to assist.

Best regards,
The Affiliate Academy Team
```

### Referral Commission Email Content:
```
Subject: New Referral Commission Earned! 💰

Hello [Referrer's Name]! 👋

Great news! [New User's Name] just registered using your referral link. 
You've earned ₦[Total Amount] in commissions! 

Your commission breakdown: 
- ₦[Commission Amount] commission 
- ₦[Balance Amount] balance

The amount has been added to your account and is available for withdrawal. 
Keep sharing your referral link to earn more!

We're here to help you succeed [Referrer's Name]! If you have any questions, 
our support team is ready to assist.

Best regards,
The Affiliate Academy Team
```

---

## 🔧 Configuration

### Environment Variables (.env)
```env
GMAIL_USER=affiliateacademy89@gmail.com
APP_PASSWORD=plbikrpjgivamgwa
```

### Gmail Setup Required:
1. ✅ 2-Step Verification enabled
2. ✅ App Password generated
3. ✅ "Less secure app access" NOT needed (app password handles this)

---

## 🎯 Email Flow Diagram

```
User Registration
    ↓
Payment Completed (Paystack)
    ↓
verifyPaystack() called
    ↓
Transaction saved to DB
    ↓
📧 Welcome Email → New User
    ↓
Referral Code exists? → YES → Process Commission
    ↓                            ↓
    NO                      Update referrer balance
    ↓                            ↓
Skip referral              📧 Commission Email → Referrer
    ↓                            ↓
Return success ←────────────────┘
```

---

## 🛠️ Customization

### To modify email content:
Edit `Server/template/adminMail.html`

### To add more email types:
```javascript
// Example: Password reset email
await sendEmailDirect({
  to: user.email,
  subject: 'Reset Your Password',
  message: 'Click the link below to reset your password...',
  name: user.full_name
});
```

### To change email sender name:
```javascript
// In mailservices.js, change:
from: `"Affiliate Academy" <${process.env.GMAIL_USER}>`
// To:
from: `"Your Custom Name" <${process.env.GMAIL_USER}>`
```

---

## ⚠️ Troubleshooting

### Email not sending?
1. Check server console for errors
2. Verify Gmail credentials in .env
3. Test with: `GET /api/mail/test`
4. Check Gmail app password hasn't expired

### Email going to spam?
- Normal for new sending domains
- Ask users to mark as "Not Spam"
- Consider adding SPF/DKIM records (advanced)

### Emails delayed?
- Gmail may rate-limit new accounts
- Normal delay: 1-5 minutes
- Check Gmail sent folder

---

## 🚀 Next Steps (Optional Enhancements)

1. **Email Verification:** Send verification link after registration
2. **Password Reset:** Email with reset token
3. **Withdrawal Request:** Notify admin when user requests withdrawal
4. **Admin Notifications:** Email admin when new user registers
5. **Scheduled Emails:** Weekly summary to users
6. **Email Templates:** Multiple designs for different purposes

---

## 📊 Testing Checklist

- [ ] Server starts without errors
- [ ] Test endpoint works (`/api/mail/test`)
- [ ] New user receives welcome email
- [ ] Referrer receives commission email
- [ ] Emails display correctly in Gmail
- [ ] Emails display correctly in mobile
- [ ] Email variables replaced correctly ({{name}}, {{message}})
- [ ] Failed emails don't break registration

---

## 📞 Support

If you encounter issues:
1. Check server console logs
2. Verify environment variables
3. Test email service first
4. Check spam folder
5. Verify Gmail app password is correct

**Current Status:** ✅ Fully Implemented and Ready to Test
