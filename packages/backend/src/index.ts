import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Import routers
import authRouter from './routes/auth.routes';
import userRouter from './routes/user.routes';
import candidateRouter from './routes/candidate.routes';
import clientRouter from './routes/client.routes';
import applicationRouter from './routes/application.routes';
import paymentRouter from './routes/payment.routes';
import costRouter from './routes/cost.routes';
import agentRouter from './routes/agent.routes';
import brokerRouter from './routes/broker.routes';
import settingRouter from './routes/setting.routes';
import feeTemplateRouter from './routes/feeTemplate.routes';
import dashboardRouter from './routes/dashboard.routes';
import publicRouter from './routes/public.routes';

// Import middleware
import { errorHandler } from './middleware/error.middleware';
import { notFound } from './middleware/notFound.middleware';

// Load environment variables
dotenv.config();

// Initialize Prisma Client
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Create Express app
const app: Express = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:5173', // Vite default port
      // Add your production frontend URLs here
      'https://jobline.vercel.app',
      'https://jobline-frontend.vercel.app',
    ];
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/candidates', candidateRouter);
app.use('/api/clients', clientRouter);
app.use('/api/applications', applicationRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/costs', costRouter);
app.use('/api/agents', agentRouter);
app.use('/api/brokers', brokerRouter);
app.use('/api/settings', settingRouter);
app.use('/api/fee-templates', feeTemplateRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/public', publicRouter); // For client shareable links

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});

export default app;
