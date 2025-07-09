import { Request, Response } from "express";
import pool from "../config/db";

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const [users] = await pool.execute(
            `SELECT * FROM users`
        )
        if ((users as any[]).length == 0) {
            res.status(200).json({ message: 'No users found' })
            return;
        }
        res.status(200).json(users);
    } catch (error: any) {
        console.log('getAllUsers error', error);
        res.status(500).json({ message: 'getAllUsers failed', error: error.message })
    }
}

export const addQuestion = async (req: Request, res: Response) => {
    try {
        const questionText = req.body.questionText;
        const questionDescription = req.body.questionDescription;
        const categoryId = req.body.categoryId;
        const answers: any[] = req.body.answers; // [{text: string, isCorrect: boolean}]

        const [questionResult] = await pool.query(
            `
                INSERT INTO questions (category_id, text, description)
                VALUES (?, ?, ?)
                
            `,
            [categoryId, questionText, questionDescription]
        )
        if ((questionResult as any).affectedRows <= 0) {
            res.status(500).json({ message: 'addQuestion failed' })
            return;
        }
        const questionId = (questionResult as any).insertId;

        let hasError = false;
        answers.forEach(async a => {
            const [answerResult] = await pool.query(
                `
                INSERT INTO answers (question_id, text, is_correct)
                VALUES (?, ?, ?)
                
            `,
                [questionId, a.text, a.isCorrect]
            )
            if ((questionResult as any).affectedRows <= 0) {
                hasError = true;
            }
        })
        if (hasError) {
            res.status(500).json({ message: 'addQuestion failed' })
            return;
        }
        res.status(200).json({message: 'Question successfully added.'});
    } catch (error: any) {
        console.log('addQuestion error', error);
        res.status(500).json({ message: 'getAllUsers failed', error: error.message })
    }
}