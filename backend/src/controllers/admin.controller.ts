import { Request, Response } from "express";
import pool, { getAllUsersFromDB } from "../config/db";
import { broadCastUserBanned, broadcastUserDeleted, broadCastUserUnbanned, isUserOnline } from "../websockets/matchmaking.ws";
import { QuizQuestion } from "../models/Quiz/QuizQuestion";
import { QuizAnswer } from "../models/Quiz/QuizAnswer";

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const [users] = await pool.execute(
            `
            SELECT * FROM users
            ORDER BY username
            `
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

export const getAllQuestions = async (req: Request, res: Response) => {
    try {
        const questionsResult = await pool.query(
            `   SELECT *
                FROM questions q
                ORDER BY q.difficulty
                    `
        );
        if ((questionsResult as any[]).length == 0) {
            res.status(400).json({ message: 'No questions found' })
            return;
        }
        let questions: QuizQuestion[] = (questionsResult[0] as any[]);
        const questionIds = questions.map((q: any) => q.id);
        const answersResult = await pool.query(
            `SELECT id, question_id, text, is_correct FROM answers WHERE question_id IN (?) ORDER BY RAND()`,
            [questionIds]);
        if ((answersResult as any[]).length == 0) {
            res.status(400).json({ message: 'No answers found' })
            return;
        }
        const answers: QuizAnswer[] = (answersResult[0] as any[]);
        const groupedAnswers: { [key: number]: any[] } = {};
        answers.forEach((a: any) => {
            if (!groupedAnswers[a.question_id]) {
                groupedAnswers[a.question_id] = [];
            }
            groupedAnswers[a.question_id].push(new QuizAnswer(a.id, a.text, a.is_correct));
        });
        questions = questions.map((q: any) => ({
            id: q.id,
            category_id: q.category_id,
            text: q.text,
            description: q.description,
            difficulty: q.difficulty,
            answers: groupedAnswers[q.id] || []
        }));
        res.status(200).json(questions);
    } catch (error: any) {
        console.log('getAllQuestions error', error);
        res.status(500).json({ message: 'getAllQuestions failed', error: error.message })
    }
}

export const addQuestion = async (req: Request, res: Response) => {
    try {
        const questionText = req.body.questionText;
        const questionDescription = req.body.questionDescription;
        const categoryId = req.body.categoryId;
        const difficulty = req.body.difficulty;
        const answers: any[] = req.body.answers; // [{text: string, isCorrect: boolean}]

        const [questionResult] = await pool.query(
            `
                INSERT INTO questions (category_id, text, description, difficulty)
                VALUES (?, ?, ?, ?)
                
            `,
            [categoryId, questionText, questionDescription, difficulty]
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
            if ((answerResult as any).affectedRows <= 0) {
                hasError = true;
            }
        })
        if (hasError) {
            res.status(500).json({ message: 'addQuestion failed' })
            return;
        }
        res.status(200).json({ message: 'Question successfully added.' });
    } catch (error: any) {
        console.log('Add question error', error);
        res.status(500).json({ message: 'Add question failed', error: error.message })
    }
}

export const deleteQuestion = async (req: Request, res: Response) => {
    try {
        const questionId = req.params.questionId;

        const [questionResult] = await pool.query(
            `
                DELETE FROM questions q WHERE q.id = ?                
            `,
            [questionId]
        )
        if ((questionResult as any).affectedRows <= 0) {
            res.status(500).json({ message: 'deleteQuestion failed' })
            return;
        }

        res.status(200).json({ message: 'Question successfully deleted.' });
    } catch (error: any) {
        console.log('Delete question error', error);
        res.status(500).json({ message: 'Delete question failed', error: error.message })
    }
}

export const updateQuestion = async (req: Request, res: Response) => {

    try {
        const { questionId, questionText, questionDescription, categoryId, difficulty, answers } = req.body;

        const [qRes] = await pool.query(
            `UPDATE questions
         SET category_id = ?, text = ?, description = ?, difficulty = ?
       WHERE id = ?`,
            [categoryId, questionText, questionDescription, difficulty, questionId]
        );
        if ((qRes as any).affectedRows === 0) {
            throw new Error('Question not found or not updated');
        }

        await pool.query(
            `DELETE FROM answers
         WHERE question_id = ?`,
            [questionId]
        );

        for (const a of answers) {
            const [aRes] = await pool.query(
                `INSERT INTO answers (question_id, text, is_correct)
         VALUES (?, ?, ?)`,
                [questionId, a.text, a.isCorrect]
            );
            if ((aRes as any).affectedRows === 0) {
                throw new Error('Failed to insert an answer');
            }
        }

        res.status(200).json({ message: 'Question successfully updated.' });
    } catch (error: any) {
        console.error('Update question error', error);
        res.status(500).json({
            message: 'Update question failed',
            error: error.message
        });
    }
}

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;

        const userOnline = isUserOnline(Number.parseInt(userId));

        if (userOnline) {
            res.status(200).json({ message: 'User is currently online.' });
            return;
        }

        const [getUserResult] = await pool.query(
            `
                SELECT * 
                FROM users u
                WHERE u.id = ?
            `,
            [userId]
        )

        if ((getUserResult as any[]).length === 0) {
            res.status(409).json({ message: 'User has already been deleted.' });
            return;
        }

        const [userResult] = await pool.query(
            `
                DELETE 
                FROM users u
                WHERE u.id = ?            
            `,
            [userId]
        )

        if ((userResult as any).affectedRows <= 0) {
            res.status(500).json({ message: 'Delete user failed' })
            return;
        }
        broadcastUserDeleted(Number.parseInt(userId));
        res.status(200).json({ message: 'User deleted successfully.' });
    } catch (error: any) {
        console.log('Delete user error', error);
        res.status(500).json({ message: 'Delete user failed', error: error.message })
    }
}

export const banUser = async (req: Request, res) => {
    try {
        const userId = req.body.userId;
        const date = req.body.date;

        const [user] = await pool.query('SELECT banned_until FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if ((user as any)[0].banned_until) {
            return res.status(409).json({ message: 'User already banned' });
        }
        const [banDateResult] = await pool.query(
            `
                UPDATE users u
                SET u.banned_until = ?
                WHERE u.id = ?           
            `,
            [date, userId]
        )

        if ((banDateResult as any).affectedRows <= 0) {
            res.status(500).json({ message: 'Ban user failed' })
            return;
        }
        broadCastUserBanned(userId, date);
        res.status(200).json({ message: 'User has been banned successfully.' });
    } catch (error: any) {
        console.log('Ban user error', error);
        res.status(500).json({ message: 'Ban user failed', error: error.message })
    }
}

export const unbanUser = async (req: Request, res) => {
    try {
        const userId = req.body.userId;

        const [user] = await pool.query('SELECT banned_until FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if ((user as any)[0].banned_until === null) {
            return res.status(409).json({ message: 'User already unbanned' });
        }

        const [banDateResult] = await pool.query(
            `
                UPDATE users u
                SET u.banned_until = null
                WHERE u.id = ?           
            `,
            [userId]
        )

        if ((banDateResult as any).affectedRows <= 0) {
            res.status(500).json({ message: 'Unban user failed' })
            return;
        }
        broadCastUserUnbanned(userId);
        res.status(200).json({ message: 'User has been unbanned successfully.' });
    } catch (error: any) {
        console.log('Unban user error', error);
        res.status(500).json({ message: 'Unban user failed', error: error.message })
    }
}

export const addCategory = async (req: Request, res) => {
    try {
        const { categoryName } = req.body;
        const [catResult] = await pool.execute(
            `INSERT INTO categories (name) VALUES (?)`,
            [categoryName]
        )
        if ((catResult as any).affectedRows <= 0) {
            res.status(500).json({ message: 'Add category failed.' });
            return;
        }
        const categoryId = (catResult as any).insertId;
        const users = await getAllUsersFromDB();
        users.forEach(async u => {
            const [resultRanking] = await pool.execute(
                `INSERT INTO rankings (user_id, category_id) VALUES (?, ?)`,
                [u.id, categoryId]
            )
            if ((resultRanking as any).affectedRows <= 0) {
                res.status(500).json({ message: 'Add category failed' })
                return;
            }
        })
        res.status(200).json({ categoryId, message: 'Category has been added successfully.' });
    } catch (error: any) {
        console.log('Add category error', error);
        res.status(500).json({ message: 'Add category failed', error: error.message })
    }
}

export const deleteCategory = async (req: Request, res) => {
    try {
        const categoryId = req.params.categoryId;
        const [catResult] = await pool.execute(
            `DELETE FROM categories c WHERE c.id = ?`,
            [categoryId]
        )
        if ((catResult as any).affectedRows <= 0) {
            res.status(500).json({ message: 'Delete category failed.' });
            return;
        }
        res.status(200).json({ message: 'Category has been deleted successfully.' });
    } catch (error: any) {
        console.log('Delete category error', error);
        res.status(500).json({ message: 'Delete category failed', error: error.message })
    }
}

