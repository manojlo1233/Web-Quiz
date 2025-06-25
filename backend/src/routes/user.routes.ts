import express from 'express'
import {
    getLeaderBoard,
    getUserById,
    getUserByUsername,
    getUserPlayHistoryById,
    getUserQuizQuestionsById,
    getUsersByUsername,
    getUserStatisticsById,
    loginUser,
    registerUser,
    requestPasswordReset,
    resetPassword,
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
userRouter.get('/getUserQuizQuestionsById/:userId/:quizId', getUserQuizQuestionsById)
userRouter.get('/getLeaderBoard', getLeaderBoard);
userRouter.post('/updateUserSettingsById', updateUserSettingsById);

export default userRouter;