import { Request, Response } from "express";
import pool from "../config/db";
import bcrypt from 'bcrypt'
import { User } from "../models/User";

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

        res.status(200).json({ message: 'Login successful', user: { id: user.id, username: user.username } });
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