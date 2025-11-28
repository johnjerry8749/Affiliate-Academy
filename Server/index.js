// index.js - SIMPLER VERSION
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet'
import fileUpload from 'express-fileupload';
import './services/mailservices.js';
// import './seedAdmin.js'

dotenv.config();

const app = express();

import paymentVerificationRoutes from './routes/paymentVerification.js';
import mailRoutes from './routes/mail.js';
import adminLoginRouter from './routes/adminAuth.js';
import Adminrouter from './routes/adminRoutes.js';
import systemConfig from './routes/systemSettingsRoutes.js';
import withdrawalRoutes from './routes/withdrawal.js';
import estateRoutes from './routes/estate.js';
import routerforAdminCryptoUdate from './routes/cryptoPaymentRoutes.js';
import adminReset from './routes/adminResetpassword.js';
import videoRoutes from './routes/videoRoutes.js';

// Simple CORS setup
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'https://my-affiliateacademy.com'], // Your specific frontend URLs
  credentials: true
}));

app.use(morgan('dev'));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
  abortOnLimit: true,
  createParentPath: true
}));

// Root route
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Affiliate Academy API',
    status: 'running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api', paymentVerificationRoutes);
app.use('/api', mailRoutes);
app.use('/api/adminlogin', adminLoginRouter);
app.use('/api/admin', Adminrouter);
app.use('/api/setting', systemConfig);
app.use('/api/withdrawal', withdrawalRoutes);
app.use('/api/estate', estateRoutes);
app.use('/api/admin/crypto-payment', routerforAdminCryptoUdate);
app.use('/api/admin', adminReset);
app.use('/api/video', videoRoutes);

const PORT = process.env.PORT || 5000;

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString() 
  });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`CORS enabled for: http://localhost:5173 and https://affiliate-academy-e8o9.vercel.app`);
  });
}

// Export for Vercel
export default app;