import { Request, Response } from "express";
import pool from "../config/db";
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import nodemailer from 'nodemailer'

import { User } from "../models/User";
import { UserPlayHistory } from "../models/UserPlayHistory";
import { QuizDetailsQuestion } from "../models/QuizDetailsQuestion";

export const loginUser = async (req: Request, res: Response) => {
    const { userNameOrEmail, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [rows] = await pool.execute(
            `SELECT * FROM users WHERE username=? OR email=?`,
            [userNameOrEmail, userNameOrEmail]
        )
        if ((rows as any[]).length == 0) {
            res.status(200).json({ message: 'Invalid username or password' })
            return;
        }
        const user: User = rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            res.status(200).json({ message: 'Invalid username or password' })
            return
        }

        res.status(200).json({ message: 'success', user: { id: user.id, username: user.username } });
    } catch (error: any) {
        console.log('Login error', error);
        res.status(500).json({ message: 'Login failed', error: error.message })
    }
}

export const registerUser = async (req: Request, res: Response) => {
    const { firstName, lastName, email, userName, password, country, time } = req.body;
    const dateTime = new Date(time);
    try {
        const [existingEmail] = await pool.execute(
            `SELECT * FROM users WHERE email=?`,
            [email]
        )

        if ((existingEmail as any[]).length > 0) {
            res.status(200).json({ message: 'Email already taken' })
            return;
        }

        const [existingUsername] = await pool.execute(
            `SELECT * FROM users WHERE username=?`,
            [userName]
        )

        if ((existingUsername as any[]).length > 0) {
            res.status(200).json({ message: 'Username already taken' })
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.execute(
            `INSERT INTO users (firstname, secondname, username, email, password_hash, country, role, created_at)` +
            `VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [firstName, lastName, userName, email, hashedPassword, country, 0, dateTime]
        );

        res.status(201).json({ message: 'User registered successfully' })
    } catch (error: any) {
        console.log('Registration error', error);
        res.status(500).json({ message: 'Registration failed', error: error.message })
    }
}

export const requestPasswordReset = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ message: 'Invalid data' });
            return;
        }

        const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        if ((users as any[]).length === 0) {
            res.status(400).json({ message: 'Email not found' });
            return;
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 1000 * 60 * 60) // 1h

        await pool.execute(
            'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?',
            [token, expires, email]
        )

        const resetLink = `http://localhost:4402/auth/reset-password/${token}`

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS
            }
        });

        await transporter.sendMail({
            to: email,
            subject: 'Reset your password',
            html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`
        });

        res.status(200).json({ message: 'Reset link sent.' })
    } catch (error) {
        console.log('Request password reset error', error);
        res.status(500).json({ message: 'Request password reset failed', error: error.message })
    }

}

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            res.status(400).json({ message: 'Invalid data' });
            return;
        }

        const [users]: any = await pool.execute(
            'SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
            [token]
        )

        if (users.length === 0) {
            res.status(400).json({ message: 'Token invalid or expired' });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.execute(
            'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
            [hashedPassword, users[0].id]
        );

        res.status(200).json({ message: 'Password updated' });
    } catch (error: any) {
        console.log('Reset password error', error);
        res.status(500).json({ message: 'Reset password error failed', error: error.message })
    }


}

export const getUserById = async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.id, 10);
        const [users] = await pool.execute(
            `SELECT * from users WHERE id=?`,
            [userId]
        )
        if ((users as any[]).length === 0) {
            res.status(404).json({ message: 'User not found' })
            return;
        }
        const user: User = (users as any[])[0]
        res.status(200).json({
            id: user.id,
            firstname: user.firstname,
            lastname: user.lastname,
            username: user.username,
            email: user.email,
            country: user.country,
            role: user.role
        });
    } catch (error: any) {
        console.log('Get user by id error', error);
        res.status(500).json({ message: 'Get user by id failed', error: error.message })
    }
}

export const getUserStatisticsById = async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.id, 10);
        const [statistics] = await pool.execute(
            `SELECT * from statistics WHERE user_id=?`,
            [userId]
        )
        if ((statistics as any[]).length === 0) {
            res.status(404).json({ message: 'User statistic not found' })
            return;
        }
        const statistic: User = (statistics as any[])[0]
        res.status(200).json({
            ...statistic
        });
    } catch (error: any) {
        console.log('Get user statistics by id error', error);
        res.status(500).json({ message: 'Get user statistics by id failed', error: error.message })
    }
}

export const getUserPlayHistoryById = async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.id, 10);
        const [userHistory] = await pool.execute(
            `SELECT qa.user_id,
                q.id AS quiz_id,
                c.name AS category,
                q.difficulty,
                qa.started_at AS start,
                qa.completed_at AS end
            FROM
                quiz_attempts qa
            JOIN
                quizzes q ON qa.quiz_id = q.id
            JOIN
                categories c ON q.category_id = c.id
            WHERE 
                qa.user_id = ?`,
            [userId]
        )
        if ((userHistory as any[]).length === 0) {
            res.status(404).json({ message: 'User history not found' })
            return;
        }
        const userPlayHistory: UserPlayHistory[] = (userHistory as any[]);
        res.status(200).json(userPlayHistory);
    } catch (error: any) {
        console.log('Get user play history by id error', error);
        res.status(500).json({ message: 'Get user play history by id failed', error: error.message })
    }
}

export const getUserQuizQuestionsById = async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.userId, 10);
        const quizId = parseInt(req.params.quizId, 10);
        const [quizDetails] = await pool.execute(
            `SELECT 
                q.text AS question_text,
                ua_ans.text AS user_answer_text,
                ua_ans.is_correct AS is_correct,
                ca.text AS correct_answer_text,
                q.description AS question_description
            FROM 
                quiz_attempts a
            JOIN 
                quiz_attempt_questions ua ON a.id = ua.attempt_id
            JOIN 
                questions q ON ua.question_id = q.id
            LEFT JOIN 
                answers ua_ans ON ua.answer_id = ua_ans.id
            LEFT JOIN 
                answers ca ON ca.question_id = q.id AND ca.is_correct = true
            WHERE 
                a.quiz_id = ? AND a.user_id = ?
            ORDER BY 
                q.id;`,
            [quizId, userId]
        )
        if ((quizDetails as any[]).length === 0) {
            res.status(404).json({ message: 'Quiz questions not found' })
            return;
        }
        const quizQuestions: QuizDetailsQuestion[] = (quizDetails as any[]);
        res.status(200).json(quizQuestions);
    } catch (error: any) {
        console.log('Get quiz question by id error', error);
        res.status(500).json({ message: 'Get quiz question by id failed', error: error.message })
    }
}