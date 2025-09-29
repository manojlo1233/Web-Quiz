import express from 'express'
import { getAllCategories, getAvailableAvatars, getLeaderBoard } from '../controllers/util.controller';
import { authenticate } from '../middleware/authenticate';

const utilRouter = express.Router();

utilRouter.get('/getAvailableAvatars', authenticate, getAvailableAvatars);
utilRouter.get('/getAllCategories', authenticate, getAllCategories);
utilRouter.get('/getLeaderBoard/:category', authenticate, getLeaderBoard);
export default utilRouter;