import express from 'express';
import { updateWithdrawalStatus } from '../controller/withdrawalController.js';

const router = express.Router();

// Update withdrawal status (admin only - add auth middleware if needed)
router.put('/update-status', updateWithdrawalStatus);

export default router;
