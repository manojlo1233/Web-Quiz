import { Request, Response } from "express";
import pool, { getAllCategoriesFromDB } from "../config/db";
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import nodemailer from 'nodemailer'

import { User } from "../models/User";
import { UserPlayHistory } from "../models/UserPlayHistory";
import { QuizDetailsQuestion } from "../models/QuizDetailsQuestion";
import { checkIfUserSessionExists } from "../websockets/matchmaking.ws";

export const loginUser = async (req: Request, res: Response) => {
    const { userNameOrEmail, password } = req.body;
    try {
        const [rows] = await pool.execute(
            `SELECT * FROM users WHERE username=? OR email=?`,
            [userNameOrEmail, userNameOrEmail]
        )
        if ((rows as any[]).length == 0) {
            res.status(404).json({ message: 'Invalid username or password' });
            return;
        }
        const user: User = rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            res.status(404).json({ message: 'Invalid username or password' });
            return
        }

        const userSessionExists = checkIfUserSessionExists(user.id);
        if (userSessionExists) {
            res.status(403).json({ message: 'You are already logged in on different device. Please log out from that device to continue.' });
            return;
        }

        const [loginResult] = await pool.execute(
            `UPDATE users u
            SET u.last_login = NOW()
            WHERE u.id=?`,
            [user.id]
        )
        if ((loginResult as any).affectedRows <= 0) {
            res.status(404).json({ message: 'Login error' });
        }

        res.status(200).json({ message: 'success', user: { id: user.id, username: user.username } });
    } catch (error: any) {
        console.log('Login error', error);
        res.status(500).json({ message: 'Login failed', error: error.message });
    }
}

export const registerUser = async (req: Request, res: Response) => {
    const { firstName, lastName, email, userName, password, country, time, notification } = req.body;
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

        const [resultUser] = await pool.execute(
            `INSERT INTO users (firstname, lastname, username, email, password_hash, country, role, created_at, receive_updates)` +
            `VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [firstName, lastName, userName, email, hashedPassword, country, 0, dateTime, notification]
        );
        if ((resultUser as any).affectedRows <= 0) {
            res.status(500).json({ message: 'Register user failed' })
            return;
        }

        const userId = (resultUser as any).insertId;
        const [resultStatistics] = await pool.execute(
            `INSERT INTO statistics (user_id, total_quizzes, avg_score, avg_time) VALUES (?, 0, 0, 0)`,
            [userId]
        )
        if ((resultStatistics as any).affectedRows <= 0) {
            res.status(500).json({ message: 'Register user failed' })
            return;
        }
        const availableCategories = await getAllCategoriesFromDB();
        availableCategories.forEach(async c => {
            const [resultRanking] = await pool.execute(
                `INSERT INTO rankings (user_id, category_id) VALUES (?, ?)`,
                [userId, c.id]
            )
            if ((resultRanking as any).affectedRows <= 0) {
                res.status(500).json({ message: 'Register user failed' })
                return;
            }
        })


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

        const resetLink = `http://192.168.19.62:4402/auth/reset-password/${token}`

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
            role: user.role,
            receive_updates: user.receive_updates,
            avatar: user.avatar,
            banned_until: user.banned_until
        });
    } catch (error: any) {
        console.log('Get user by id error', error);
        res.status(500).json({ message: 'Get user by id failed', error: error.message })
    }
}

export const getUserByUsername = async (req: Request, res: Response) => {
    try {
        const username = req.params.username;
        const [users] = await pool.execute(
            `SELECT * from users WHERE username=?`,
            [username]
        )
        if ((users as any[]).length === 0) {
            res.status(404).json({ message: 'User not found' })
            return;
        }
        const user: User = (users as any[])[0]
        res.status(200).json({
            ...user
        });
    } catch (error: any) {
        console.log('Get user by username error', error);
        res.status(500).json({ message: 'Get user by username failed', error: error.message })
    }
}

export const getUsersByUsername = async (req: Request, res: Response) => {
    try {
        const searchUsername = req.body.searchUsername;
        const userUsername = req.body.userUsername;
        const [users] = await pool.execute(
            `SELECT id, username from users WHERE LOWER(username) LIKE LOWER(?) AND username!=? LIMIT 50`,
            [`%${searchUsername}%`, userUsername]
        )
        if ((users as any[]).length === 0) {
            res.status(404).json({ message: 'Users not found' })
            return;
        }
        res.status(200).json(users);
    } catch (error: any) {
        console.log('Get users by username error', error);
        res.status(500).json({ message: 'Get users by username failed', error: error.message })
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
            `SELECT 
                qa.user_id,
                q.id AS quiz_id,
                c.name AS category,
                qa.started_at AS start,
                qa.completed_at AS end,
                opponent_attempt.user_id AS opponent_id,
                u.username AS opponent_username,
                winner_id AS winner_id,
                player_left_id AS player_left_id
            FROM
                quiz_attempts qa
            JOIN
                quizzes q ON qa.quiz_id = q.id
            JOIN
                categories c ON q.category_id = c.id
            LEFT JOIN
                battles b ON b.quiz_id = qa.quiz_id
            LEFT JOIN
                quiz_attempts opponent_attempt ON opponent_attempt.quiz_id = qa.quiz_id
                    AND opponent_attempt.user_id != qa.user_id
            LEFT JOIN 
                users u ON u.id = opponent_attempt.user_id
            WHERE 
                qa.user_id = ?
            ORDER BY
                qa.started_at DESC
            `,
            [userId]
        );
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

export const getUserQuizDetails = async (req: Request, res: Response) => {
    try {
        const quizId = parseInt(req.params.quizId, 10);
        const [quizDetails] = await pool.execute(
            `SELECT 
                q.text AS question_text,
                ua_ans.text AS user_answer_text,
                ua_ans.is_correct AS is_correct,
                ca.text AS correct_answer_text,
                q.description AS question_description,
                a.user_id AS user_id
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
                a.quiz_id = ?
            ORDER BY 
                q.id;`,
            [quizId]
        )
        const quizQuestions: QuizDetailsQuestion[] = (quizDetails as any[]);
        res.status(200).json(quizQuestions);
    } catch (error: any) {
        console.log('Quiz details error', error);
        res.status(500).json({ message: 'Quiz details failed', error: error.message })
    }
}

export const updateUserSettingsById = async (req: Request, res: Response) => {
    try {
        const userId = req.body.userId;
        const firstName = req.body.firstName;
        const lastName = req.body.lastName;
        const username = req.body.username;
        const email = req.body.email;
        const country = req.body.country;
        const receive_updates = req.body.receive_updates;
        const [result] = await pool.execute(
            `UPDATE users u
            SET
                u.firstname=?,
                u.lastname=?,
                u.username=?,
                u.email=?,
                u.country=?,
                u.receive_updates=?   
            WHERE
                u.id=?
            `
            , [firstName, lastName, username, email, country, receive_updates, userId])
        if ((result as any).affectedRows <= 0) {
            res.status(404).json({ message: 'Update user failed.' })
            return;
        }
        res.status(200).json({ message: 'User settings successfully updated.' });
    } catch (error: any) {
        console.log('Update user error', error);
        res.status(500).json({ message: 'User settings update failed', error: error.message })
    }
}

export const updateUserAvatar = async (req: Request, res: Response) => {
    try {
        const userId = req.body.userId;
        const avatar = req.body.avatar;
        const [result] = await pool.execute(
            `UPDATE users u
            SET
                u.avatar=?
            WHERE
                u.id=?
            `
            , [avatar, userId])
        if ((result as any).affectedRows <= 0) {
            res.status(404).json({ message: 'Update user avatar failed.' })
            return;
        }
        res.status(200).json({ message: 'User avatar successfully updated.' });
    } catch (error: any) {
        console.log('Update user avatar error', error);
        res.status(500).json({ message: 'Update user avatar failed', error: error.message })
    }
}

export const getUserReports = async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;

        const [result] = await pool.execute(
            `   SELECT r.reason as reason,
                    r.reportTime as time,
                    u.username as reportFrom
                FROM reports r
                LEFT JOIN users u ON r.userIdReportFrom = u.id
                WHERE userIdReportTo = ?
            `
            , [userId])
        if ((result as any[]).length == 0) {
            res.status(404).json({ message: 'User reports not found.' })
            return;
        }
        res.status(200).json(result);
    } catch (error: any) {
        console.log('Get user reports error', error);
        res.status(500).json({ message: 'Get user reports failed', error: error.message })
    }
}

export const getUserRankings = async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;

        const [result] = await pool.execute(
            `   SELECT  r.user_id as userId,
                        r.category_id as categoryId,
                        r.score as score
                FROM rankings r
                WHERE r.user_id = ?
            `
            , [userId])
        if ((result as any[]).length == 0) {
            res.status(404).json({ message: 'User ranking not found.' })
            return;
        }
        res.status(200).json(result);
    } catch (error: any) {
        console.log('Get user rankings error', error);
        res.status(500).json({ message: 'Get user rankings failed', error: error.message })
    }
}

