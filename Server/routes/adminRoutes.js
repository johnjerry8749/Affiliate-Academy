import express from 'express';
import { verifyAdminToken } from '../middleware/verifyAdminToken.js';
import { 
    getProfile, 
    listAdmins, 
    promoteToAdmin, 
    demoteAdmin, 
    getAllUsers, 
    deleteUser ,
    getDashboardData,
    ensureUserBalance,
    updateUserBalance
} from '../controller/adminAuth.js';
import {
    getAllCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    linkVideoToCourse,
    unlinkVideoFromCourse,
    getCourseWithVideo,
    syncVideoStatus
} from '../controller/courseController.js';

// Initialize admin router for all admin-specific routes
const Adminrouter = express.Router();

// =============================================
// PROFILE & USER MANAGEMENT ROUTES
// =============================================

Adminrouter.get('/dashboard', verifyAdminToken, getDashboardData);

/**
 * GET /api/admin/profile
 * Retrieves the authenticated admin's profile information
 * Protected by admin token verification middleware
 */
Adminrouter.get('/profile', verifyAdminToken, getProfile);

/**
 * GET /api/admin/users
 * Fetches a list of all users in the system
 * Requires admin privileges for access
 */
Adminrouter.get('/users', verifyAdminToken, getAllUsers);

/**
 * DELETE /api/admin/users/:id
 * Permanently deletes a user account from the system
 * :id - The unique identifier of the user to delete
 */
Adminrouter.delete('/users/:id', verifyAdminToken, deleteUser);

/**
 * POST /api/admin/users/:id/ensure-balance
 * Ensures a balance record exists for the user
 * :id - The unique identifier of the user
 */
Adminrouter.post('/users/:id/ensure-balance', verifyAdminToken, ensureUserBalance);

/**
 * PUT /api/admin/users/:id/update-balance
 * Updates the balance record for the user
 * :id - The unique identifier of the user
 */
Adminrouter.put('/users/:id/update-balance', verifyAdminToken, updateUserBalance);

// =============================================
// ADMIN ROLE MANAGEMENT ROUTES
// =============================================

/**
 * GET /api/admin/list
 * Retrieves a list of all users with admin privileges
 * Used for admin team management and oversight
 */
Adminrouter.get('/list', verifyAdminToken, listAdmins);

/**
 * POST /api/admin/promote
 * Elevates a regular user to admin status
 * Expects user ID in request body
 * Requires careful authorization checks
 */
Adminrouter.post('/promote', verifyAdminToken, promoteToAdmin);

/**
 * DELETE /api/admin/demote/:id
 * Removes admin privileges from a user (demotes to regular user)
 * :id - The unique identifier of the admin to demote
 * Prevents self-demotion and maintains at least one admin
 */
Adminrouter.delete('/demote/:id', verifyAdminToken, demoteAdmin);

// =============================================
// COURSE MANAGEMENT ROUTES
// =============================================

/**
 * GET /api/admin/courses
 * Retrieves all courses in the system
 * Protected by admin token verification
 */
Adminrouter.get('/courses', verifyAdminToken, getAllCourses);

/**
 * POST /api/admin/course
 * Creates a new course
 * Expects course data in request body
 */
Adminrouter.post('/course', verifyAdminToken, createCourse);

/**
 * PUT /api/admin/course/:id
 * Updates an existing course
 * :id - The unique identifier of the course to update
 */
Adminrouter.put('/course/:id', verifyAdminToken, updateCourse);

/**
 * DELETE /api/admin/course/:id
 * Deletes a course from the system (includes Bunny video cleanup)
 * :id - The unique identifier of the course to delete
 */
Adminrouter.delete('/course/:id', verifyAdminToken, deleteCourse);

// =============================================
// VIDEO MANAGEMENT ROUTES
// =============================================

/**
 * GET /api/admin/course/:id/video
 * Get course with detailed video information
 */
Adminrouter.get('/course/:id/video', verifyAdminToken, getCourseWithVideo);

/**
 * POST /api/admin/course/:courseId/video/link
 * Link existing Bunny video to course
 * Body: { videoId: string, title?: string }
 */
Adminrouter.post('/course/:courseId/video/link', verifyAdminToken, linkVideoToCourse);

/**
 * DELETE /api/admin/course/:courseId/video/unlink
 * Unlink video from course (removes metadata from Supabase)
 */
Adminrouter.delete('/course/:courseId/video/unlink', verifyAdminToken, unlinkVideoFromCourse);

/**
 * POST /api/admin/course/:courseId/video/sync
 * Sync video status from Bunny to Supabase
 */
Adminrouter.post('/course/:courseId/video/sync', verifyAdminToken, syncVideoStatus);

// Export the configured admin router for use in main application
export default Adminrouter;