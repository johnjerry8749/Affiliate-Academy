// Admin Menu Configuration Data
export const ADMIN_MENU_ITEMS = [
    {
      title: 'Dashboard', 
      icon: 'fas fa-tachometer-alt', 
      path: '/admin/dashboard',
      description: 'Admin Dashboard Overview' },
    { 
      title: 'Manage Users',
      icon: 'fas fa-users',
      path: '/admin/users',
      description: 'User Management',
      submenu: [
        { title: 'All Users', path: '/admin/users/all' },
      ]
    },
    {
      title: 'Course Management',
      icon: 'fas fa-graduation-cap',
      path: '/admin/courses',
      description: 'Upload & Manage Courses',
      submenu: [
        { title: 'Upload Course', path: '/admin/courses/upload' },
      ]
    },
    {
      title: 'Payment Requests',
      icon: 'fas fa-money-check-alt',
      path: '/admin/payments',
      description: 'Withdrawal Requests',
    },
    {
      title: 'Real Estate',
      icon: 'fas fa-house-user',
      path: '/admin/realestate',
      description: 'Real Estate Management',
    },
    {
      title: 'Crypto Payment Proofs',
      icon: 'fas fa-file-invoice-dollar',
      path: '/admin/userspaymentcrypto',
      description: 'Manage Crypto Payment Proofs',
    },
    {
      title: 'Referral Management',
      icon: 'fas fa-user-friends',
      path: '/admin/referrals',
      description: 'Manage Referrals',
    },
    {
      title: 'Site Settings',
      icon: 'fas fa-cogs',
      path: '/admin/settings',
      description: 'System Configuration',
      submenu: [
        { title: 'General Settings', path: '/admin/settings/general' },
      ]
    },
    
];

// Profile Menu Items
export const PROFILE_MENU_ITEMS = [
    {
      title: 'Administrator',
      type: 'header'
    },
    {
      title: 'View Profile',
      icon: 'fas fa-user',
      path: '/admin/profile'
    },
    {
      title: 'Account Settings',
      icon: 'fas fa-cog',
      path: '/admin/account'
    },
    {
      title: 'Change Password',
      icon: 'fas fa-key',
      path: '/admin/change-password'
    },
    {
      title: 'Logout',
      icon: 'fas fa-sign-out-alt',
      path: '/logout',
      className: 'text-danger'
    }
];

// Sidebar Configuration
export const SIDEBAR_CONFIG = {
  brandText: 'Admin Panel',
  searchPlaceholder: 'Search admin panel...',
  adminName: 'Administrator',
  adminStatus: 'Online',
  adminAvatar: 'https://ui-avatars.com/api/?name=Admin&background=8b4513&color=fff&size=40'
};