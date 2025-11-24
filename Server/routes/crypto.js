import express from 'express';
import { updateCryptoPaymentStatus } from '../controller/cryptoController.js';

const router = express.Router();

// Update crypto payment status (approve/reject)
router.put('/update-status', updateCryptoPaymentStatus);

export default router;
