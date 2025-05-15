import expess from 'express'
import { loginUser, registerUser } from '../controllers/user.controller';
const userRouter = expess.Router();

userRouter.post('/loginUser', loginUser)
userRouter.post('/registerUser', registerUser);


export default userRouter;