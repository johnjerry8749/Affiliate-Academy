// backend/controller/adminAuth.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../utils/supabaseClient.js';

export const adminLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data: admin, error } = await supabase
      .from('admins')
      .select('id, email, password, role, created_at')
      .eq('email', email)
      .single();

    if (error || !admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    // create JWT (signed with server secret)
    const token = jwt.sign({ id: admin.id, role: admin.role }, process.env.JWT_SECRET, {
      expiresIn: '3h'
    });

    // return admin data minus password
    const { password: _p, ...adminWithoutPassword } = admin;

    res.json({ message: 'Login successful', token, admin: adminWithoutPassword });
  } catch (err) {
    console.error('adminLogin error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// controllers/adminController.js
export const getAllUsers = async (req, res) => {
  try {
    // Read query params (with defaults)
    const { page = 1, limit = 10, search = '' } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const start = (pageNum - 1) * limitNum;
    const end = start + limitNum - 1;

    // Base query
    let query = supabase
      .from('users')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(start, end);

    // Add search filter if search query exists
    if (search.trim()) {
      query = query.or(
        `full_name.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return res.status(400).json({ message: error.message });
    }

    res.json({
      users: data,
      total: count,
      currentPage: pageNum,
      totalPages: Math.ceil(count / limitNum),
    });
  } catch (error) {
    console.error('getAllUsers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};



export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    // Delete user balances first
    const { error: balanceError } = await supabase
      .from('user_balances')
      .delete()
      .eq('user_id', id);

    if (balanceError) {
      console.error('Error deleting balances:', balanceError);
    }

    // Delete user
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting user:', error);
      return res.status(400).json({ message: error.message });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('deleteUser error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};



export const getDashboardData = async (req, res) => {
  try {
    // Total users
    const { count: totalUsers, error: totalUsersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (totalUsersError) throw totalUsersError;

    // Active users
    const { count: activeUsers, error: activeUsersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .or('is_blocked.is.null,is_blocked.eq.false');

    if (activeUsersError) throw activeUsersError;

    // Blocked users
    const { count: blockedUsers, error: blockedUsersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_blocked', true);

    if (blockedUsersError) throw blockedUsersError;

    const inactiveUsers = (totalUsers || 0) - (activeUsers || 0);

    // Registration deposits (already in Naira)
    const { data: transactionsData, error: transactionsError } = await supabase
      .from('transactions')
      .select('amount')
      .eq('status', 'success');

    if (transactionsError) throw transactionsError;

    const totalRegistrationDeposits = transactionsData?.reduce(
      (sum, record) => sum + (parseFloat(record.amount) || 0), // No need to divide, already in Naira
      0
    ) || 0;

    console.log(totalRegistrationDeposits)

    // Available balances
    const { data: balanceData, error: balanceError } = await supabase
      .from('user_balances')
      .select('available_balance');

    if (balanceError) throw balanceError;
    console.log(balanceData)
    const totalBalance = balanceData?.reduce(
      (sum, record) => sum + (parseFloat(record.available_balance) || 0),
      0
    ) || 0;

    // Withdrawals
    const { data: withdrawalData, error: withdrawalError } = await supabase
      .from('withdrawal_requests')
      .select('amount');

    if (withdrawalError) throw withdrawalError;

    const totalPayout = withdrawalData?.reduce(
      (sum, record) => sum + (parseFloat(record.amount) || 0),
      0
    ) || 0;

    // Courses count
    const { count: totalCourses, error: coursesError } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true });

    if (coursesError) throw coursesError;

    // Company wallet total earnings
    const { data: companyWalletData, error: companyWalletError } = await supabase
      .from('company_wallet')
      .select('total_earnings');

    if (companyWalletError) throw companyWalletError;

    const companyTotalEarnings = companyWalletData?.reduce(
      (sum, record) => sum + (parseFloat(record.total_earnings) || 0),
      0
    ) || 0;

    // ✅ Send all together
    return res.json({
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      inactiveUsers: inactiveUsers || 0,
      blockedUsers: blockedUsers || 0,
      totalCourses: totalCourses || 0,
      totalBalance,
      totalRegistrationDeposits,
      totalTransactions: withdrawalData?.length || 0,
      totalPayout,
      companyTotalEarnings,
    });

  } catch (error) {
    console.error('getDashboardData error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard data' });
  }
};

export const getProfile = async (req, res) => {
  // req.admin is set by middleware
  try {
    const { id } = req.admin;
    const { data: admin, error } = await supabase
      .from('admins')
      .select('id, email, role, created_at')
      .eq('id', id)
      .single();

    if (error || !admin) return res.status(404).json({ message: 'Admin not found' });
    res.json(admin);
  } catch (err) {
    console.error('getProfile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// admin management endpoints (requires adminAuth)
export const listAdmins = async (req, res) => {
  try {
    const { data, error } = await supabase.from('admins').select('id, email, role, created_at');
    if (error) return res.status(400).json({ message: error.message });
    res.json(data);
  } catch (err) {
    console.error('listAdmins error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const promoteToAdmin = async (req, res) => {
  const { userId, email } = req.body; // userId optional; if userId missing will create with gen_random_uuid
  try {
    const insertObj = userId ? { id: userId, email, role: 'admin' } : { email, role: 'admin' };
    const { data, error } = await supabase.from('admins').insert([insertObj]);
    if (error) return res.status(400).json({ message: error.message });
    res.json({ message: 'Promoted', data });
  } catch (err) {
    console.error('promoteToAdmin error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const demoteAdmin = async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from('admins').delete().eq('id', id);
    if (error) return res.status(400).json({ message: error.message });
    res.json({ message: 'Demoted successfully' });
  } catch (err) {
    console.error('demoteAdmin error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const ensureUserBalance = async (req, res) => {
  const { id: userId } = req.params;
  console.log('ensureUserBalance for userId:', userId); 

  try {
    // Check if exists
    let existing = null;
    try {
      const result = await supabase.from('user_balances').select('user_id').eq('user_id', userId).single();
      existing = result.data;
    } catch (checkError) {
      if (checkError.code !== 'PGRST116') { // Not "no rows found"
        throw checkError;
      }
      // No balance exists, existing remains null
    }

    if (existing) {
      return res.json({ message: 'Balance already exists' });
    }

    // Get user currency
    const { data: user } = await supabase.from('users').select('currency').eq('id', userId).single();

    const currency = user?.currency || 'USD';

    // Insert
    const { error } = await supabase.from('user_balances').insert({
      user_id: userId,
      available_balance: 0,
      pending_balance: 0,
      total_earned: 0,
      total_withdrawn: 0,
      currency,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;

    res.json({ message: 'Balance created' });
  } catch (err) {
    console.error('ensureUserBalance error:', err);
    res.status(500).json({ error: 'Failed to ensure balance' });
  }
};

export const updateUserBalance = async (req, res) => {
  const { id: userId } = req.params;
  const { available_balance, pending_balance, total_earned, total_withdrawn, currency } = req.body;

  try {
    // Check if balance exists
    let existing = null;
    try {
      const result = await supabase.from('user_balances').select('user_id').eq('user_id', userId).single();
      existing = result.data;
    } catch (checkError) {
      if (checkError.code === 'PGRST116') { // No rows found
        return res.status(404).json({ error: 'Balance record not found' });
      }
      throw checkError;
    }

    // Update the balance
    const { error } = await supabase
      .from('user_balances')
      .update({
        available_balance: parseFloat(available_balance) || 0,
        pending_balance: parseFloat(pending_balance) || 0,
        total_earned: parseFloat(total_earned) || 0,
        total_withdrawn: parseFloat(total_withdrawn) || 0,
        currency: currency || 'USD',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ message: 'Balance updated successfully' });
  } catch (err) {
    console.error('updateUserBalance error:', err);
    res.status(500).json({ error: 'Failed to update balance' });
  }
};

// Get all users with their referrals and commission history
export const getUsersWithReferrals = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const start = (pageNum - 1) * limitNum;
    const end = start + limitNum - 1;

    // Build query for users
    let query = supabase
      .from('users')
      .select('id, full_name, email, referral_code, referrer_id, currency, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(start, end);

    // Add search filter
    if (search.trim()) {
      query = query.or(
        `full_name.ilike.%${search}%,email.ilike.%${search}%,referral_code.ilike.%${search}%`
      );
    }

    const { data: users, error: usersError, count } = await query;

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return res.status(400).json({ message: usersError.message });
    }

    // For each user, get their referrals and commission data
    const usersWithReferrals = await Promise.all(
      users.map(async (user) => {
        // Get users referred by this user (users who used this user's referral code)
        const { data: referrals, error: referralsError } = await supabase
          .from('users')
          .select('id, full_name, email, created_at')
          .eq('referrer_id', user.id);

        if (referralsError) {
          console.error('Error fetching referrals for user:', user.id, referralsError);
        }

        // Get commission transactions for this user
        const { data: commissions, error: commissionsError } = await supabase
          .from('referral_commissions')
          .select('*')
          .eq('referrer_id', user.id);

        // Calculate total commission
        let totalCommission = 0;
        if (commissions && commissions.length > 0) {
          totalCommission = commissions.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
        }

        // Map referrals with their commission amounts
        const referralsWithCommission = (referrals || []).map(ref => {
          const commission = commissions?.find(c => c.referred_user_id === ref.id);
          return {
            ...ref,
            commission_amount: commission?.amount || 0,
            commission_paid: commission?.status === 'paid' || commission?.is_paid || false
          };
        });

        return {
          ...user,
          referral_count: referrals?.length || 0,
          total_commission: totalCommission,
          referrals: referralsWithCommission
        };
      })
    );

    res.json({
      data: usersWithReferrals,
      total: count,
      currentPage: pageNum,
      totalPages: Math.ceil(count / limitNum)
    });
  } catch (error) {
    console.error('getUsersWithReferrals error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};
