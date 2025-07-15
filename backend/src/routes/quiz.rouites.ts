import express from 'express'
import { getRandomHints, reportUser } from '../controllers/quiz.controller';

const quizRouter = express.Router();

quizRouter.get('/getRandomHints', getRandomHints);
quizRouter.post('/reportUser', reportUser);

export default quizRouter;