
import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.js';
import apiRoutes from './routes/api.js';
import publicRoutes from './routes/public.js';

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 8080;

app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// Health
app.get('/health', (req,res)=>res.json({ ok: true }));

// Routes
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/public', publicRoutes);

// Start
app.listen(PORT, () => {
  console.log(`API listening on :${PORT}`);
});
