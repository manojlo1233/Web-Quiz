import express from 'express';
import {
    getUserFriendsById,
    deleteUserFriendById,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    getUserFriendsOnlineStatus
} from '../controllers/friends.controller';

const friendsRouter = express.Router();

friendsRouter.get('/getUserFriendsById/:userId', getUserFriendsById);
friendsRouter.delete('/deleteUserFriendById/:userId/:friendId', deleteUserFriendById);
friendsRouter.post('/sendFriendRequest', sendFriendRequest);
friendsRouter.put('/acceptFriendRequest', acceptFriendRequest);
friendsRouter.delete('/rejectFriendRequest/:userId/:friendId', rejectFriendRequest);
friendsRouter.post('/getUserFriendsOnlineStatus', getUserFriendsOnlineStatus);


export default friendsRouter;