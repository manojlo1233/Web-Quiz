import expess from 'express'
import { loginUser, registerUser, requestPasswordReset, resetPassword } from '../controllers/user.controller';
const userRouter = expess.Router();

userRouter.post('/loginUser', loginUser)
userRouter.post('/registerUser', registerUser);
userRouter.post('/requestPasswordReset', requestPasswordReset);
userRouter.post('/resetPassword', resetPassword);


export default userRouter;