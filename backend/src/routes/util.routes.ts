import express from 'express'
import { getAvailableAvatars } from '../controllers/util.controller';

const utilRouter = express.Router();

utilRouter.get('/getAvailableAvatars', getAvailableAvatars);

export default utilRouter;