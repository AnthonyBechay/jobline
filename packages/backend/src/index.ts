import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Import type extensions
import './types';

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
import feeComponentRouter from './routes/feeComponent.routes';
import dashboardRouter from './routes/dashboard.routes';
import publicRouter from './routes/public.routes';
import documentItemRouter from './routes/documentItem.routes';
import documentTemplateRouter from './routes/documentTemplate.routes';
import fileRouter from './routes/file.routes';
import nationalitiesRouter from './routes/nationalities.routes';
import companyRouter from './routes/company.routes';
import costTypeRouter from './routes/costType.routes';
import serviceTypeRouter from './routes/serviceType.routes';
import candidatePdfRouter from './routes/candidatePdf.routes';
import documentSearchRouter from './routes/documentSearch.routes';
import guarantorChangeRouter from './routes/guarantorChange.routes';
import applicationCancellationRouter from './routes/applicationCancellation.routes';
import officeOverheadCostsRouter from './routes/officeOverheadCosts.routes';
import businessSettingsRouter from './routes/businessSettings.routes';

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

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Jobline API Server',
    version: '1.0.0',
    status: 'running',
    environment: process.env.NODE_ENV,
    health: '/api/health'
  });
});

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
app.use('/api/documents', documentSearchRouter);
app.use('/api/clients', clientRouter);
app.use('/api/applications', applicationRouter);
app.use('/api/cancellations', applicationCancellationRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/costs', costRouter);
app.use('/api/agents', agentRouter);
app.use('/api/brokers', brokerRouter);
app.use('/api/settings', settingRouter);
app.use('/api/fee-templates', feeTemplateRouter);
app.use('/api/fee-components', feeComponentRouter); // Enhanced fee templates with components
app.use('/api/dashboard', dashboardRouter);
app.use('/api/public', publicRouter); // For client shareable links
app.use('/api/document-items', documentItemRouter);
app.use('/api/document-templates', documentTemplateRouter);
app.use('/api/files', fileRouter);
app.use('/api/nationalities', nationalitiesRouter);
app.use('/api/company', companyRouter);
app.use('/api/cost-types', costTypeRouter);
app.use('/api/service-types', serviceTypeRouter);
app.use('/api/candidates/:id/export-pdf', candidatePdfRouter);
app.use('/api/guarantor-changes', guarantorChangeRouter);
app.use('/api/office-overhead', officeOverheadCostsRouter);
app.use('/api/business-settings', businessSettingsRouter);

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
