import express from 'express';
import { addQuestion, deleteUser, getAllUsers } from '../controllers/admin.controller';

const adminRouter = express.Router();

adminRouter.get('/getAllUsers', getAllUsers);
adminRouter.post('/addQuestion', addQuestion);
adminRouter.delete('/deleteUser/:userId', deleteUser);

export default adminRouter;