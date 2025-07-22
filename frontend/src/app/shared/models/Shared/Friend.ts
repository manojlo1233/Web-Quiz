export class Friend {
    friendId: number;
    username: string;
    userIdSent: number;
    accepted: boolean;
    online: boolean;
    battleRequestSent: boolean = false;
    battleRequestReceived: boolean = false;
}