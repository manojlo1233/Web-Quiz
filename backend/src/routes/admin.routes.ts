import express from 'express';
import { addQuestion, banUser, deleteUser, getAllUsers, unbanUser } from '../controllers/admin.controller';

const adminRouter = express.Router();

adminRouter.get('/getAllUsers', getAllUsers);
adminRouter.post('/addQuestion', addQuestion);
adminRouter.delete('/deleteUser/:userId', deleteUser);
adminRouter.post('/banUser', banUser);
adminRouter.post('/unbanUser', unbanUser);

export default adminRouter;