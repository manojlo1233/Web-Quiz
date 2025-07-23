import express from 'express';
import {
    getUserFriendsById,
    deleteUserFriendById,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    getUserFriendsOnlineStatus
} from '../controllers/friends.controller';
import { authenticate } from '../middleware/authenticate';

const friendsRouter = express.Router();

friendsRouter.get('/getUserFriendsById/:userId', authenticate, getUserFriendsById);
friendsRouter.delete('/deleteUserFriendById/:userId/:friendId',authenticate, deleteUserFriendById);
friendsRouter.post('/sendFriendRequest',authenticate, sendFriendRequest);
friendsRouter.put('/acceptFriendRequest',authenticate, acceptFriendRequest);
friendsRouter.delete('/rejectFriendRequest/:userId/:friendId',authenticate, rejectFriendRequest);
friendsRouter.post('/getUserFriendsOnlineStatus',authenticate, getUserFriendsOnlineStatus);


export default friendsRouter;