import { Request, Response } from "express";
import pool from "../config/db";

export const getRandomHints = async (req: Request, res: Response) => {
    try {
        const [hints] = await pool.execute(
            `SELECT * FROM hints ORDER BY RAND() LIMIT 10`
        )
        if ((hints as any[]).length == 0) {
            res.status(200).json({ message: 'No hints found' })
            return;
        }
        res.status(200).json(hints);
    } catch (error: any) {
        console.log('getRandomHints error', error);
        res.status(500).json({ message: 'getRandomHints failed', error: error.message })
    }
}