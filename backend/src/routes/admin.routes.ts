import express from 'express';
import { addQuestion, getAllUsers } from '../controllers/admin.controller';

const adminRouter = express.Router();

adminRouter.get('/getAllUsers', getAllUsers);
adminRouter.post('/addQuestion', addQuestion);

export default adminRouter;