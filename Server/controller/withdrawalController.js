import { supabase } from '../utils/supabaseClient.js';
import { sendEmailDirect } from '../services/mailservices.js';

// Fetch all withdrawal requests with user details
export const getWithdrawalRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build query for withdrawal requests
    let query = supabase
      .from('withdrawal_requests')
      .select('*', { count: 'exact' })
      .order('request_date', { ascending: false });

    // Filter by status if provided
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Search by transaction_id or amount
    if (search && search.trim()) {
      const searchNum = parseFloat(search);
      if (!isNaN(searchNum)) {
        query = query.or(`transaction_id.ilike.%${search}%,amount.eq.${searchNum}`);
      } else {
        query = query.ilike('transaction_id', `%${search}%`);
      }
    }

    // Pagination
    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data: withdrawalData, error: withdrawalError, count } = await query;

    if (withdrawalError) {
      console.error('Error fetching withdrawals:', withdrawalError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch withdrawal requests: ' + withdrawalError.message
      });
    }

    // Fetch user data for each withdrawal
    let withdrawalsWithUsers = [];
    if (withdrawalData && withdrawalData.length > 0) {
      const userIds = [...new Set(withdrawalData.map(w => w.user_id))];
      
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .in('id', userIds);

      if (usersError) {
        console.error('Error fetching users:', usersError);
      }

      // Map users to withdrawals
      withdrawalsWithUsers = withdrawalData.map(withdrawal => ({
        ...withdrawal,
        users: usersData?.find(user => user.id === withdrawal.user_id) || null
      }));
    }

    return res.status(200).json({
      success: true,
      data: withdrawalsWithUsers,
      total: count || 0,
      page: parseInt(page),
      limit: parseInt(limit)
    });

  } catch (error) {
    console.error('Error in getWithdrawalRequests:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

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

    // First check if withdrawal exists
    const { data: checkData, error: checkError } = await supabase
      .from('withdrawal_requests')
      .select('id, user_id, amount, status, currency')
      .eq('id', withdrawalId);

    console.log('Check result:', { checkData, checkError });

    if (checkError) {
      console.error('Error checking withdrawal:', checkError);
      return res.status(500).json({
        success: false,
        message: 'Database error: ' + checkError.message
      });
    }

    if (!checkData || checkData.length === 0) {
      console.error('No withdrawal found with ID:', withdrawalId);
      return res.status(404).json({
        success: false,
        message: 'Withdrawal request not found'
      });
    }

    const withdrawal = checkData[0];

    // Get user info separately
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('full_name, email, currency')
      .eq('id', withdrawal.user_id)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
    }

    const withdrawalData = {
      ...withdrawal,
      users: userData || null
    };

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
      
      // Always fetch user's currency directly from database to ensure accuracy
      console.log('Fetching user currency from database...');
      const { data: currencyData, error: currencyError } = await supabase
        .from('users')
        .select('currency')
        .eq('id', withdrawal.user_id)
        .single();
      
      if (currencyError) {
        console.error('Error fetching user currency:', currencyError);
      }
      
      const currency = currencyData?.currency;
      console.log('User currency:', currency);
      
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
      const symbol = currencySymbols[currency] || currency;

      if (userEmail) {
        if (status === 'approved') {
          // Send approval email
          await sendEmailDirect({
            to: userEmail,
            subject: ' Withdrawal Request Approved',
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
          console.log(` Approval email sent to ${userEmail}`);
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
          console.log(` Rejection email sent to ${userEmail}`);
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
