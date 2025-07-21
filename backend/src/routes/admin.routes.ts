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

const adminRouter = express.Router();

adminRouter.get('/getAllUsers', getAllUsers);
adminRouter.get('/getAllQuestions', getAllQuestions);
adminRouter.post('/addQuestion', addQuestion);
adminRouter.delete('/deleteQuestion/:questionId', deleteQuestion);
adminRouter.delete('/deleteUser/:userId', deleteUser);
adminRouter.post('/banUser', banUser);
adminRouter.post('/unbanUser', unbanUser);
adminRouter.post('/updateQuestion', updateQuestion)
adminRouter.post('/addCategory', addCategory);
adminRouter.delete('/deleteCategory/:categoryId', deleteCategory);

export default adminRouter;