import { Request, Response } from "express";
import { getAvailableAvatarsUtil } from "../util/util";

export const getAvailableAvatars = async (req: Request, res: Response) => {
    try {
        const avatars: string[] = getAvailableAvatarsUtil();
        res.status(200).json(avatars);
    } catch (error: any) {
        console.log('Get available avatars error', error);
        res.status(500).json({ message: 'Get available avatars failed', error: error.message })
    }
}