import mysql from 'mysql2/promise';         
import dotenv from 'dotenv';

dotenv.config();       
export const createConnection = async () => {
  try {
    const connection = await mysql.createConnection({
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
    });

    console.log('Uspešno povezan sa MySQL bazom');
  } catch (err) {
    console.error('Greška prilikom povezivanja sa bazom:', err);
  }
};