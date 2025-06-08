import express from 'express';
import {
    getUserFriendsById,
    deleteUserFriendById
} from '../controllers/friends.controller';

const friendsRouter = express.Router();

friendsRouter.get('/getUserFriendsById/:userId', getUserFriendsById);
friendsRouter.delete('/deleteUserFriendById/:userId/:friendId', deleteUserFriendById);

export default friendsRouter;