// index.js - SIMPLER VERSION
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import './services/mailservices.js';
// import './seedAdmin.js'

dotenv.config();

const app = express();

import paymentVerificationRoutes from './routes/paymentVerification.js';
import mailRoutes from './routes/mail.js';
import adminLoginRouter from './routes/adminAuth.js';
import Adminrouter from './routes/adminRoutes.js';
import systemConfig from './routes/systemSettingsRoutes.js';

// Simple CORS setup
app.use(cors({
  origin: ['http://localhost:5173', 'https://affiliate-academy-e8o9.vercel.app'], // Your specific frontend URLs
  credentials: true
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', paymentVerificationRoutes);
app.use('/api', mailRoutes);
app.use('/api/adminlogin', adminLoginRouter);
app.use('/api/admin', Adminrouter);
app.use('/api/setting', systemConfig);

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString() 
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS enabled for: http://localhost:5173 and https://affiliate-academy-e8o9.vercel.app`);
});