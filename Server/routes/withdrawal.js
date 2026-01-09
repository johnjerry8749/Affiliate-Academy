import express from 'express';
import { updateWithdrawalStatus, getWithdrawalRequests } from '../controller/withdrawalController.js';

const router = express.Router();

// Get all withdrawal requests (admin only)
router.get('/requests', getWithdrawalRequests);

// Update withdrawal status (admin only - add auth middleware if needed)
router.put('/update-status', updateWithdrawalStatus);

export default router;
