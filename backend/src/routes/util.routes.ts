import express from 'express'
import { getAllCategories, getAvailableAvatars, getLeaderBoard } from '../controllers/util.controller';

const utilRouter = express.Router();

utilRouter.get('/getAvailableAvatars', getAvailableAvatars);
utilRouter.get('/getAllCategories', getAllCategories);
utilRouter.get('/getLeaderBoard/:category', getLeaderBoard);
export default utilRouter;