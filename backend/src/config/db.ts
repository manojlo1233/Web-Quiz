import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
})

export const createConnection = async() => {
  try {
    const connection = await pool.getConnection();
    console.log('Uspesno povezivanje sa bazom.')
    connection.release();
  }
  catch(error) {
    console.log('Neuspesno povezivanje sa bazom', error);
  }
};

export default pool;