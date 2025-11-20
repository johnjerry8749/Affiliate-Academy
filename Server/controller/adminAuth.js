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

export const getUserBalance = async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log('user id ', userId);

    // Fetch ALL rows for that user
    const { data, error } = await supabase
      .from('referral_commissions')
      .select('balance_amount')
      .eq('referred_user_id', userId);

    if (error) throw error;

    console.log("Commission Rows:", data);

    // If no rows → use empty array
    const commissions = data || [];

    // Sum all balances using reduce()
    const totalBalance = commissions.reduce((sum, row) => {
      return sum + Number(row.balance_amount || 0);
    }, 0);

    return res.status(200).json({
      success: true,
      balance: {
        available_balance: totalBalance,
        pending_balance: 0,
        total_earned: totalBalance,
        total_withdrawn: 0,
        currency: req.user?.currency || "USD"
      }
    });

  } catch (err) {
    console.error("Balance fetch error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to fetch user balance"
    });
  }
};


export const updateUserBalance = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { amount } = req.body;
    console.log('Updating balance for user:', userId, 'Amount:', amount);

    // Validate input
    if (amount === undefined || isNaN(amount)) {
      return res.status(400).json({
        success: false,
        error: "Amount must be a valid number"
      });
    }

    const numericAmount = Number(amount);

    // 1️⃣ Delete all old rows for this user
    const { error: deleteError } = await supabase
      .from("referral_commissions")
      .delete()
      .eq("referred_user_id", userId);

    if (deleteError) throw deleteError;

    // 2️⃣ Insert a fresh row with the updated balance
    const { data, error: insertError } = await supabase
      .from("referral_commissions")
      .insert([
        {
          referred_user_id: userId,
          balance_amount: numericAmount
        }
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    console.log('Balance updated successfully:', data);

    return res.status(200).json({
      success: true,
      message: "User balance updated successfully",
      updatedAmount: numericAmount,
      balance: data
    });

  } catch (err) {
    console.error("Update Balance Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to update balance"
    });
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

    // Registration deposits
    const { data: transactionsData, error: transactionsError } = await supabase
      .from('transactions')
      .select('amount')
      .eq('status', 'success');

    if (transactionsError) throw transactionsError;

    const totalRegistrationDeposits = transactionsData?.reduce(
      (sum, record) => sum + (parseFloat(record.amount) || 0),
      0
    ) || 0;

    // Available balances
    const { data: balanceData, error: balanceError } = await supabase
      .from('user_balances')
      .select('available_balance');

    if (balanceError) throw balanceError;

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
