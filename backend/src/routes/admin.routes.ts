import express from 'express';
import {
    addCategory,
    addQuestion,
    banUser,
    deleteCategory,
    deleteQuestion,
    deleteUser,
    getAllQuestions,
    getAllUsers,
    unbanUser,
    updateQuestion
} from '../controllers/admin.controller';
import { authenticate } from '../middleware/authenticate';

const adminRouter = express.Router();

adminRouter.get('/getAllUsers',authenticate, getAllUsers);
adminRouter.get('/getAllQuestions',authenticate, getAllQuestions);
adminRouter.post('/addQuestion',authenticate, addQuestion);
adminRouter.delete('/deleteQuestion/:questionId',authenticate, deleteQuestion);
adminRouter.delete('/deleteUser/:userId',authenticate, deleteUser);
adminRouter.post('/banUser',authenticate, banUser);
adminRouter.post('/unbanUser',authenticate, unbanUser);
adminRouter.post('/updateQuestion',authenticate, updateQuestion)
adminRouter.post('/addCategory',authenticate, addCategory);
adminRouter.delete('/deleteCategory/:categoryId',authenticate, deleteCategory);

export default adminRouter;