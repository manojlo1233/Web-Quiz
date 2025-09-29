import express from 'express'
import { loginUser, logoutUser, refresh, registerUser, requestPasswordReset, resetPassword } from '../controllers/auth.controller';

export const authRouter = express.Router();

authRouter.post('/loginUser', loginUser)
authRouter.post('/registerUser', registerUser);
authRouter.post('/logoutUser', logoutUser);
authRouter.post('/requestPasswordReset', requestPasswordReset);
authRouter.post('/resetPassword', resetPassword);
authRouter.post('/refresh', refresh);