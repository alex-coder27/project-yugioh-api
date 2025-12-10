import 'dotenv/config';
import express from 'express';
import authRoutes from './routes/authRoutes'
import cors from 'cors';

const app = express();
const port = 3000;

app.use(cors()); 
app.use(express.json());

app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.status(200).send('Servidor Yu-Gi-Oh! API está rodando.');
});

app.listen(port, () => {
    console.log(`Backend rodando em http://localhost:${port}`);
});