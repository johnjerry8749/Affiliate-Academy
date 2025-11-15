import express from 'express';
import {validateSettings} from '../middleware/validateSettings.js'
import {verifyAdminToken} from '../middleware/verifyAdminToken.js';
import {getSystemSettings, saveSystemSettings} from '../controller/systemSettingsController.js'
const systemConfig = express.Router();

systemConfig.get('/getSettings', verifyAdminToken,getSystemSettings);
systemConfig.post('/saveSettings', verifyAdminToken , validateSettings, saveSystemSettings);

export default systemConfig ;


