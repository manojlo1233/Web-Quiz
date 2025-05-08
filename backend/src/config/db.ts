import mysql from 'mysql2/promise';         // Koristi se mysql2 biblioteka sa async/wait podrškom
import dotenv from 'dotenv';

dotenv.config();        // Učitavanje .env promenljive

export const createConnection = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,        // Učitavanje iz env. fajla
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
    });

    console.log('Uspešno povezan sa MySQL bazom');
    // Možda ostaviš kao globalnu konekciju ako ne koristiš ORM
  } catch (err) {
    console.error('Greška prilikom povezivanja sa bazom:', err);
  }
};