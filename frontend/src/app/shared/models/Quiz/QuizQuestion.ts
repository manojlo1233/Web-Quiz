import { QuizAnswer } from "./QuizAnswer";

export class QuizQuestion {
    id: number;
    category_id: number;
    text: string;
    description: string;
    difficulty: number;
    answers: QuizAnswer[];
}