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
    updateUserAvatar,
    updateUserSettingsById
} from '../controllers/user.controller';
import { authenticate } from '../middleware/authenticate';

const userRouter = express.Router();

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