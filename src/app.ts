import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { adminRouter } from './routes/admin';
import { authRouter } from './routes/auth';
import { budgetRouter } from './routes/budget';
import { categoryRouter } from './routes/category';
import { dashboardRouter } from './routes/dashboard';
import { expenseRouter } from './routes/expense';
import { healthRouter } from './routes/health';

export const app = express();

// Render sits behind one proxy; this lets rate limiting see the real client IP
app.set('trust proxy', 1);

app.use(helmet());
// CLIENT_ORIGIN can hold several comma-separated origins
app.use(cors({ origin: env.CLIENT_ORIGIN.split(',').map((o) => o.trim()) }));
app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/expenses', expenseRouter);
app.use('/api/budgets', budgetRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/admin', adminRouter);

app.use(notFoundHandler);
app.use(errorHandler);
