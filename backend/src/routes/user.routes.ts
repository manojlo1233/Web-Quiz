import expess from 'express'
import { getUserById, getUserStatisticsById, loginUser, registerUser, requestPasswordReset, resetPassword } from '../controllers/user.controller';
const userRouter = expess.Router();

userRouter.post('/loginUser', loginUser)
userRouter.post('/registerUser', registerUser);
userRouter.post('/requestPasswordReset', requestPasswordReset);
userRouter.post('/resetPassword', resetPassword);

userRouter.get('/getUserById/:id', getUserById);
userRouter.get('/getUserStatisticsById/:id', getUserStatisticsById);

export default userRouter;