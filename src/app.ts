import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { authRouter } from './routes/auth';
import { expenseRouter } from './routes/expense';
import { healthRouter } from './routes/health';

export const app = express();

app.use(helmet());
// CLIENT_ORIGIN can hold several comma-separated origins
app.use(cors({ origin: env.CLIENT_ORIGIN.split(',').map((o) => o.trim()) }));
app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/expenses', expenseRouter);

app.use(notFoundHandler);
app.use(errorHandler);
