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

export const reportUser = async (req: Request, res: Response) => {
    try {
        const userIdReportTo = req.body.userIdReportTo;
        const userIdReportFrom = req.body.userIdReportFrom;
        const reasons = req.body.reasons;
        const quizId = req.body.quizId;

        (reasons as any[]).forEach(async r => {
            const [reportResult] = await pool.execute(
                `INSERT INTO reports (userIdReportTo, userIdReportFrom, quizId, reason, reportTime) VALUES (?, ?, ?, ?, NOW())`,
                [userIdReportTo, userIdReportFrom, quizId, r]
            )
            if ((reportResult as any).affectedRows <= 0) {
                res.status(500).json({ message: 'Report user failed' })
                return;
            }
        })
        res.status(200).json({ message: 'User reported successfully' });
    } catch (error: any) {
        console.log('Report user error', error);
        res.status(500).json({ message: 'Report user failed', error: error.message })
    }
}