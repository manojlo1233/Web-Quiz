import express from 'express'
import { getAllCategories, getAvailableAvatars } from '../controllers/util.controller';

const utilRouter = express.Router();

utilRouter.get('/getAvailableAvatars', getAvailableAvatars);
utilRouter.get('/getAllCategories', getAllCategories);

export default utilRouter;