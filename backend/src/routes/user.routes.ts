import express from 'express'
import {
    getLeaderBoard,
    getUserById,
    getUserByUsername,
    getUserPlayHistoryById,
    getUserQuizDetails,
    getUsersByUsername,
    getUserStatisticsById,
    loginUser,
    registerUser,
    requestPasswordReset,
    resetPassword,
    updateUserAvatar,
    updateUserSettingsById
} from '../controllers/user.controller';

const userRouter = express.Router();
// AUTH
userRouter.post('/loginUser', loginUser)
userRouter.post('/registerUser', registerUser);
userRouter.post('/requestPasswordReset', requestPasswordReset);
userRouter.post('/resetPassword', resetPassword);

userRouter.get('/getUserById/:id', getUserById);
userRouter.get('/getUserByUsername/:username', getUserByUsername);
userRouter.post('/getUsersByUsername', getUsersByUsername);
userRouter.get('/getUserStatisticsById/:id', getUserStatisticsById);
userRouter.get('/getUserPlayHistoryById/:id', getUserPlayHistoryById);
userRouter.get('/getUserQuizDetails/:quizId', getUserQuizDetails)
userRouter.get('/getLeaderBoard/:category', getLeaderBoard);
userRouter.post('/updateUserSettingsById', updateUserSettingsById);
userRouter.patch('/updateUserAvatar', updateUserAvatar);
export default userRouter;