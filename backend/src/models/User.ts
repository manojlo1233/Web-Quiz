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
    pass_reset_token: string;
    pass_reset_token_expires: Date;
    receive_updates: boolean;
    avatar: string;
    ranking: number;
    banned_until: Date;
    refresh_token: string;
}