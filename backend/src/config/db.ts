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

export const createConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Uspesno povezivanje sa bazom.')
    connection.release();
  }
  catch (error) {
    console.log('Neuspesno povezivanje sa bazom', error);
  }
};

export async function updateUserStatisticsAndRanking(userId: number, winnerId: number) {
  // TOTAL QUIZES
  const [totalResult] = await pool.query(
    `SELECT COUNT(*) AS total FROM quiz_attempts WHERE user_id = ? AND completed_at IS NOT NULL`,
    [userId]
  );
  const totalQuizzes = (totalResult as any)[0]?.total || 0;
  // AVG SCORE
  const [avgScoreResult] = await pool.query(
    `
        SELECT AVG(correct_ratio) AS avg_score
        FROM (
            SELECT 
                qa.id,
                COUNT(CASE WHEN qaq.is_correct = 1 THEN 1 END) / COUNT(*) * 100 AS correct_ratio
            FROM quiz_attempts qa
            JOIN quiz_attempt_questions qaq ON qa.id = qaq.attempt_id
            WHERE qa.user_id = ?
            GROUP BY qa.id
        ) AS attempt_stats
        `,
    [userId]
  );
  const avgScore = parseFloat((avgScoreResult as any)[0]?.avg_score) || 0;
  // AVG TIME
  const [avgTimeResult] = await pool.query(
    `
        SELECT AVG(TIMESTAMPDIFF(SECOND, started_at, completed_at)) AS avg_time
        FROM quiz_attempts 
        WHERE user_id = ? AND completed_at IS NOT NULL
        `,
    [userId]
  );
  const avgTime = parseFloat((avgTimeResult as any)[0]?.avg_time) || 0;

  await pool.query(
    `
        INSERT INTO statistics (user_id, total_quizzes, avg_score, avg_time)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            total_quizzes = VALUES(total_quizzes),
            avg_score = VALUES(avg_score),
            avg_time = VALUES(avg_time)
        `,
    [userId, totalQuizzes, avgScore, avgTime]
  );

  // UPDATE USER RANKING

  const rankChange = userId === winnerId ? 20 : -10;

  const [currentRankingResult] = await pool.query(
    `
      SELECT ranking 
      FROM users u
      WHERE u.id=?
    `,
    [userId]
  )

  if ((currentRankingResult as any[]).length === 0) {
    console.log('Error fetching user ranking.');
    return;
  }

  let newRanking = currentRankingResult[0].ranking + rankChange;
  newRanking = newRanking < 0 ? 0 : newRanking;

  const [rankingUpdateResult] = await pool.query(
    `
      UPDATE users
      SET ranking=?
      WHERE users.id=?
    `,
    [newRanking, userId]
  )

  if ((rankingUpdateResult as any).affectedRows <= 0) {
     console.log('Error updating user ranking.');
    return;
  }
}

export default pool;