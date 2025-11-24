import express from 'express';
import { getAllEstates, uploadEstateImage, createEstate, updateEstate, deleteEstate } from '../controller/estateController.js';

const estateRouter = express.Router();

estateRouter.get('/all', getAllEstates);
estateRouter.post('/upload-image', uploadEstateImage);
estateRouter.post('/create', createEstate);
estateRouter.put('/update/:id', updateEstate);
estateRouter.delete('/delete/:id', deleteEstate);

export default estateRouter;
