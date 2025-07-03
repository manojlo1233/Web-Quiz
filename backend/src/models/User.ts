export class User {
    id: number;
    firstname: string;
    lastname: string;
    username: string;
    email: string;
    password_hash: string;
    country: string;
    role: number;
    created_at: Date;
    reset_token: string;
    reset_token_expires: Date;
    receive_updates: boolean;
    avatar: string;
}