import express from 'express'
import { getRandomHints, reportUser } from '../controllers/quiz.controller';
import { authenticate } from '../middleware/authenticate';

const quizRouter = express.Router();

quizRouter.get('/getRandomHints', authenticate, getRandomHints);
quizRouter.post('/reportUser', authenticate, reportUser);

export default quizRouter;