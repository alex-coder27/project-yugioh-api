import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import cardRoutes from './routes/cardRoutes';
import deckRoutes from './routes/deckRoutes';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/decks', deckRoutes);

app.get('/', (req, res) => {
    res.status(200).send('Servidor Yu-Gi-Oh! API está rodando.');
});

app.listen(port, () => {
    console.log(`Backend rodando em http://localhost:${port}`);
});


export { app };