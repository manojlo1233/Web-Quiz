import expess from 'express'
import { getUserById, getUserByUsername, getUserFriendsById, getUserPlayHistoryById, getUserQuizQuestionsById, getUserStatisticsById, loginUser, registerUser, requestPasswordReset, resetPassword } from '../controllers/user.controller';
const userRouter = expess.Router();
// AUTH
userRouter.post('/loginUser', loginUser)
userRouter.post('/registerUser', registerUser);
userRouter.post('/requestPasswordReset', requestPasswordReset);
userRouter.post('/resetPassword', resetPassword);

userRouter.get('/getUserById/:id', getUserById);
userRouter.get('/getUserByUsername/:username', getUserByUsername);
userRouter.get('/getUserStatisticsById/:id', getUserStatisticsById);
userRouter.get('/getUserPlayHistoryById/:id', getUserPlayHistoryById);
userRouter.get('/getUserQuizQuestionsById/:userId/:quizId', getUserQuizQuestionsById)
userRouter.get('/getUserFriendsById/:userId', getUserFriendsById);

export default userRouter;