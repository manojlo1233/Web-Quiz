import { Request, Response } from "express";
import pool, { getAllCategoriesFromDB } from "../config/db";
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import { User } from "../models/User";
import { signAccessToken, signRefreshToken, verifyRefresh } from "../config/jwt";

export const loginUser = async (req: Request, res) => {
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

        if (user.refresh_token) {
            return res.status(400).json({ message: 'User already logged in' });
        }

        const accessToken = signAccessToken({ sub: user.id, role: user.role });
        const refreshToken = signRefreshToken({ sub: user.id, role: user.role });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000
        });

        const [loginResult] = await pool.execute(
            `       UPDATE users u
            SET u.last_login = NOW(), refresh_token = ?
            WHERE u.id=?`,
            [refreshToken, user.id]
        )
        if ((loginResult as any).affectedRows <= 0) {
            res.status(404).json({ message: 'Login error' });
        }

        res.status(200).json({ message: 'success', user: { id: user.id, username: user.username }, accessToken });
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

export const logoutUser = async (req: Request, res) => {
    const userId = (req as any).user?.id; 
    if (userId) {
        await pool.execute(`UPDATE users SET refresh_token = NULL WHERE id=?`, [userId]);
    }
    res.clearCookie('refreshToken');
    res.status(204).end();
};

export const requestPasswordReset = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ message: 'Invalid data' });
            return;
        }

        const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        if ((users as any[]).length === 0) {
            res.status(404).json({ message: 'Email not found' });
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
        console.log(token, password)
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


export const refresh = async (req: Request, res) => {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: 'No refresh token' });

    try {
        const payload = verifyRefresh(token);

        const [rows]: any = await pool.execute(
            `SELECT * FROM users WHERE id=? AND refresh_token=?`,
            [payload.sub, token]
        );
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }

        const newAccess = signAccessToken({ sub: payload.sub, role: payload.role });
        return res.json({ accessToken: newAccess });
    } catch {
        return res.status(401).json({ message: 'Invalid refresh token' });
    }
}