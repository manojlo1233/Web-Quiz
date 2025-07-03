import express from 'express';      // Uvoz Express biblioteke (web server)
import cors from 'cors';        // Uvoz CORS middleware-a (dozvoljava Angularu da salje zahteve)
import dotenv from 'dotenv';        // Učitava .env fajl (podatke kao što su lozinka baze)
import { createConnection } from './config/db';         // Funkcija za povezivanje sa bazom
import userRouter from './routes/user.routes';
import friendsRouter from './routes/friend.routes';
import { createServer } from 'http';
import initWebSocketServer from './websockets/matchmaking.ws';
import quizRouter from './routes/quiz.rouites';
import path from 'path';


dotenv.config();        // Omogućava da koristimo npr. process.env.DB_HOST

const app = express();      // Keriramo Express aplikaciju
const PORT = process.env.PORT || 3000;      // Port iz env fajla ili 3000 ako nije definisan

app.use(cors({    // Dozvoljava cross-origin zahteve (npr. iz Angular aplikacije)
  origin: '*'
}));
app.use(express.json());        // Omogućava da se šalje JSON u telu zahteva

createConnection();         // Povezivanje sa bazom

const router = express.Router()
router.use('/users', userRouter)
router.use('/friends', friendsRouter)
router.use('/quiz', quizRouter)

app.use('/api', router);

app.use('/static', express.static(path.join(__dirname, 'public')));

const server = createServer(app);
initWebSocketServer(server);

server.listen(PORT, () => {        // Pokretanje servera
  console.log(`Server radi na portu ${PORT}`);
});