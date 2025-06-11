import { Request, Response } from "express";
import pool from "../config/db";
import { sendFriendRefreshSignal } from "../websockets/matchmaking.ws";

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
            sendFriendRefreshSignal(userId, friendId, 'NONE');
            res.status(200).json({ message: "Friend deleted successfully.", });
        } else {
            res.status(404).json({ message: "Friendship not found." });
        }
    } catch (error: any) {
        console.log('Delete user friend by id error', error);
        res.status(500).json({ message: 'Delete user friend by id failed', error: error.message })
    }
}

export const sendFriendRequest = async (req: Request, res) => {
    try {
        const userId = parseInt(req.body.userId, 10);
        const friendId = parseInt(req.body.friendId, 10);
        if (isNaN(userId) || isNaN(friendId)) {
            return res.status(400).json({ error: "Invalid user IDs." });
        }
        const [result] = await pool.execute(
            `INSERT INTO friends (userId1, userId2, userIdSent, accepted) VALUES (?, ?, ?, 0)`,
            [userId, friendId, userId]
        )
        if ((result as any).affectedRows > 0) {
            sendFriendRefreshSignal(userId, friendId, 'FR_RQ_SENT');
            res.status(201).json({ message: "Friend request sent successfully." });
        } else {
            res.status(500).json({ message: "Friend request failed." });
        }
    } catch (error: any) {
        console.log('Friend request error', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(500).json({ message: 'Friend request already sent.', error: error.message })
        }
        else {
            res.status(500).json({ message: 'Friend request failed', error: error.message })
        }

    }
}

export const acceptFriendRequest = async (req: Request, res) => {
    try {
        const userId = parseInt(req.body.userId, 10);
        const friendId = parseInt(req.body.friendId, 10);
        if (isNaN(userId) || isNaN(friendId)) {
            return res.status(400).json({ error: "Invalid user IDs." });
        }
        const [result] = await pool.execute(
            `UPDATE friends SET accepted=1 WHERE 
            (userId1=? AND userId2=? AND userIdSent=?)
            OR
            (userId1=? AND userId2=? AND userIdSent=?)`,
            [userId, friendId, friendId, friendId, userId, friendId]
        )

        const [deletedDuplicateRequest] = await pool.execute(
            `DELETE FROM friends WHERE accepted=0 
            AND  
            (userId1=? AND userId2=? AND userIdSent=?)
            OR
            (userId1=? AND userId2=? AND userIdSent=?)`,
            [userId, friendId, userId, friendId, userId, userId]
        )
        if ((result as any).affectedRows > 0) {
            sendFriendRefreshSignal(userId, friendId, 'FR_RQ_ACCEPT');
            res.status(201).json({ message: "Friend request accepted successfully." });
        } else {
            res.status(500).json({ message: "Friend request accept failed." });
        }
    } catch (error: any) {
        console.log('Friend request accept error', error);
        res.status(500).json({ message: 'Friend request accept failed', error: error.message })
    }
}

export const rejectFriendRequest = async (req: Request, res) => {
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
            sendFriendRefreshSignal(userId, friendId, 'NONE');
            res.status(200).json({ message: "Friend request rejected successfully.", });
        } else {
            res.status(404).json({ message: "Friend request reject failed." });
        }
    } catch (error: any) {
        console.log('Friend request reject error', error);
        res.status(500).json({ message: 'Friend request reject failed', error: error.message })
    }
}


