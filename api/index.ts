import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from '../server/src/config';
import routes from '../server/src/routes';
import { errorHandler } from '../server/src/middleware/errorHandler';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not Found' });
});

// Export for Vercel Serverless
export default (req: VercelRequest, res: VercelResponse) => {
  return app(req, res);
};
