import express from 'express'
import { getRandomHints } from '../controllers/quiz.controller';

const quizRouter = express.Router();

quizRouter.get('/getRandomHints', getRandomHints);

export default quizRouter;