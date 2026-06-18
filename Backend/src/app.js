import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { apiRouter } from './routes/index.js';

export function createApp() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  // CORS: Allow all localhost ports in development for flexibility
  const corsOrigin = env.nodeEnv === 'production'
    ? env.clientUrl
    : /^http:\/\/localhost(:\d+)?$/;
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json());
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'gobook-backend' });
  });

  app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));
  app.use('/api', apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
