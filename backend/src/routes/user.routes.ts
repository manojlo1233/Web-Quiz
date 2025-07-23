import express from 'express'
import {
    getUserById,
    getUserByUsername,
    getUserPlayHistoryById,
    getUserQuizDetails,
    getUserRankings,
    getUserReports,
    getUsersByUsername,
    getUserStatisticsById,
    loginUser,
    logoutUser,
    registerUser,
    requestPasswordReset,
    resetPassword,
    updateUserAvatar,
    updateUserSettingsById
} from '../controllers/user.controller';
import { authenticate } from '../middleware/authenticate';

const userRouter = express.Router();
// AUTH
userRouter.post('/loginUser', loginUser)
userRouter.post('/registerUser', registerUser);
userRouter.post('/logoutUser', logoutUser);
userRouter.post('/requestPasswordReset', requestPasswordReset);
userRouter.post('/resetPassword', resetPassword);

userRouter.get('/getUserById/:id',authenticate, getUserById);
userRouter.get('/getUserByUsername/:username',authenticate, getUserByUsername);
userRouter.post('/getUsersByUsername',authenticate, getUsersByUsername);
userRouter.get('/getUserStatisticsById/:id',authenticate, getUserStatisticsById);
userRouter.get('/getUserPlayHistoryById/:id',authenticate, getUserPlayHistoryById);
userRouter.get('/getUserQuizDetails/:quizId',authenticate, getUserQuizDetails)
userRouter.post('/updateUserSettingsById',authenticate, updateUserSettingsById);
userRouter.patch('/updateUserAvatar',authenticate, updateUserAvatar);
userRouter.get('/getUserReports/:userId',authenticate, getUserReports);
userRouter.get('/getUserRankings/:userId',authenticate, getUserRankings)


export default userRouter;