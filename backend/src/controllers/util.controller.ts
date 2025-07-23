import { Request, Response } from "express";
import { getAvailableAvatarsUtil } from "../util/avatar";
import pool, { getAllCategoriesFromDB } from "../config/db";


export const getAvailableAvatars = async (req: Request, res: Response) => {
    try {
        const avatars: string[] = getAvailableAvatarsUtil();
        res.status(200).json(avatars);
    } catch (error: any) {
        console.log('Get available avatars error', error);
        res.status(500).json({ message: 'Get available avatars failed', error: error.message })
    }
}

export const getLeaderBoard = async (req: Request, res) => {
    try {
        const category: string = req.params.category as string;
        const availableCategories = await getAllCategoriesFromDB();
        if (availableCategories.filter(c => c.name === category).length === 0) {
            return res.status(400).json({ message: 'Invalid category' });
        }

        const [leaderBoard] = await pool.execute(
            `   SELECT u.id as userId, u.username, r.score as ranking
                FROM rankings r
                JOIN users u ON u.id = r.user_id
                JOIN categories c ON r.category_id = c.id 
                WHERE c.name = ?
                ORDER BY r.score DESC
                LIMIT 50
            `,
            [category]
        );
        if ((leaderBoard as any[]).length === 0) {
            res.status(404).json({ message: 'Get leaderboard not found' })
            return;
        }
        res.status(200).json(leaderBoard);
    } catch (error: any) {
        console.log('Get leaderboard error', error);
        res.status(500).json({ message: 'Get leaderboard failed', error: error.message })
    }
}

export const getAllCategories = async (req: Request, res: Response) => {
    try {
        const categories: any[] = await getAllCategoriesFromDB();
        res.status(200).json(categories);
    } catch (error: any) {
        console.log('Get available avatars error', error);
        res.status(500).json({ message: 'Get available avatars failed', error: error.message })
    }
}