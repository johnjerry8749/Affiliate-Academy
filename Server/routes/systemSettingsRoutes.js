import express from 'express';
import {validateSettings} from '../middleware/validateSettings.js'
import {verifyAdminToken} from '../middleware/verifyAdminToken.js';
import {getSystemSettings, saveSystemSettings, getRegistrationFee, updateRegistrationFee} from '../controller/systemSettingsController.js'
const systemConfig = express.Router();

systemConfig.get('/getSettings', verifyAdminToken,getSystemSettings);
systemConfig.post('/saveSettings', verifyAdminToken , validateSettings, saveSystemSettings);

// Registration fee routes
systemConfig.get('/registration-fee', getRegistrationFee); // Public
systemConfig.put('/registration-fee', verifyAdminToken, updateRegistrationFee); // Admin only

export default systemConfig ;


