import { Request, Response } from "express";
import pool from "../config/db";

export const getUserFriendsById = async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.userId, 10);
        const [userFriends] = await pool.execute(
            `SELECT 
                u.id AS friendId,
                u.username AS username,
                f.userIdSent AS userIdSent,
                f.accepted AS accepted
            FROM 
                friends f
            JOIN 
                users u ON 
                    (f.userId1 = ? AND f.userId2 = u.id)
                    OR
                    (f.userId2 = ? AND f.userId1 = u.id)
            `,
            [userId, userId]
        )
        if ((userFriends as any[]).length === 0) {
            res.status(404).json({ message: 'User friends not found' })
            return;
        }
        res.status(200).json(userFriends);
    } catch (error: any) {
        console.log('Get user friends by id error', error);
        res.status(500).json({ message: 'Get user friends by id failed', error: error.message })
    }
}

export const deleteUserFriendById = async (req: Request, res) => {
    try {
        const userId = parseInt(req.params.userId, 10);
        const friendId = parseInt(req.params.friendId, 10);
        if (isNaN(userId) || isNaN(friendId)) {
            return res.status(400).json({ error: "Invalid user IDs." });
        }
        const [result] = await pool.execute(
            `DELETE FROM 
                friends f
            WHERE 
                (f.userId1 = ? AND f.userId2 = ?)
                OR
                (f.userId2 = ? AND f.userId1 = ?)
            `,
            [userId, friendId, userId, friendId]
        )
        if ((result as any).affectedRows > 0) {
            res.status(200).json({ message: "Friend deleted successfully." });
        } else {
            res.status(404).json({ message: "Friendship not found." });
        }
    } catch (error: any) {
        console.log('Delete user friend by id error', error);
        res.status(500).json({ message: 'Delete user friend by id failed', error: error.message })
    }
}


