// routes/cryptoPaymentRoutes.js
import express from 'express';
import { updateCryptoPaymentStatus } from '../controller/cryptoPaymentController.js';
// import adminAuth from '../middleware/adminAuth.js';
import { verifyAdminToken } from '../middleware/verifyAdminToken.js';

const routerforAdminCryptoUdate = express.Router();

// POST /api/admin/crypto-payment/update
routerforAdminCryptoUdate.post('/update', verifyAdminToken, updateCryptoPaymentStatus);

export default routerforAdminCryptoUdate;