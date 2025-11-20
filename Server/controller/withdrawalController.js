import { supabase } from '../utils/supabaseClient.js';
import { sendEmailDirect } from '../services/mailservices.js';

export const updateWithdrawalStatus = async (req, res) => {
  try {
    const { withdrawalId, status } = req.body;

    if (!withdrawalId || !status) {
      return res.status(400).json({
        success: false,
        message: 'Withdrawal ID and status are required'
      });
    }

    // Validate status
    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    console.log(`Updating withdrawal ${withdrawalId} to status: ${status}`);

    // Get withdrawal request details with user info
    const { data: withdrawalData, error: fetchError } = await supabase
      .from('withdrawal_requests')
      .select('*, users(full_name, email, currency)')
      .eq('id', withdrawalId)
      .single();

    if (fetchError || !withdrawalData) {
      console.error('Error fetching withdrawal:', fetchError);
      return res.status(404).json({
        success: false,
        message: 'Withdrawal request not found'
      });
    }

    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('withdrawal_requests')
      .update(updateData)
      .eq('id', withdrawalId)
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }

    console.log('Withdrawal status updated successfully');

    // Send email notification to user
    try {
      const userEmail = withdrawalData.users?.email;
      const userName = withdrawalData.users?.full_name || 'Valued Member';
      const amount = withdrawalData.amount;
      const currency = withdrawalData.users?.currency || withdrawalData.currency || 'USD';
      
      // Currency symbols
      const currencySymbols = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'NGN': '₦',
        'GHS': '₵',
        'KES': 'KSh',
        'ZAR': 'R'
      };
      const symbol = currencySymbols[currency] || '$';

      if (userEmail) {
        if (status === 'approved') {
          // Send approval email
          await sendEmailDirect({
            to: userEmail,
            subject: '✅ Withdrawal Request Approved',
            message: `
              <p>Great news! Your withdrawal request has been approved and processed.</p>
              <p><strong>Withdrawal Details:</strong></p>
              <ul>
                <li><strong>Amount:</strong> ${symbol}${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</li>
                <li><strong>Status:</strong> Approved & Paid</li>
                <li><strong>Date:</strong> ${new Date().toLocaleDateString()}</li>
              </ul>
              <p>The funds have been transferred to your registered account. Please allow 1-3 business days for the transaction to reflect in your account.</p>
              <p>If you have any questions or don't receive the funds within the specified time, please contact our support team.</p>
              <p>Thank you for being a valued member of Affiliate Academy!</p>
            `,
            name: userName
          });
          console.log(`✅ Approval email sent to ${userEmail}`);
        } else if (status === 'rejected') {
          // Send rejection email
          await sendEmailDirect({
            to: userEmail,
            subject: ' Withdrawal Request Declined',
            message: `
              <p>We regret to inform you that your withdrawal request has been declined.</p>
              <p><strong>Withdrawal Details:</strong></p>
              <ul>
                <li><strong>Amount:</strong> ${symbol}${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</li>
                <li><strong>Status:</strong> Declined</li>
                <li><strong>Date:</strong> ${new Date().toLocaleDateString()}</li>
              </ul>
              <p><strong>Possible Reasons:</strong></p>
              <ul>
                <li>Insufficient balance verification</li>
                <li>Incomplete or incorrect account details</li>
                <li>Account security concerns</li>
                <li>Violation of terms and conditions</li>
              </ul>
              <p>Your funds remain in your account balance. Please verify your account details and contact our support team for more information.</p>
              <p>If you believe this was declined in error, please reach out to us at <strong>${process.env.GMAIL_USER}</strong>.</p>
            `,
            name: userName
          });
          console.log(`📧 Rejection email sent to ${userEmail}`);
        }
      }
    } catch (emailError) {
      console.error('Error sending email notification:', emailError);
      // Don't fail the request if email fails, just log it
    }

    return res.status(200).json({
      success: true,
      message: `Withdrawal ${status} successfully`,
      data: data[0]
    });

  } catch (error) {
    console.error('Error updating withdrawal status:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};
