import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './services/database.js';

const app = createApp();

try {
  await connectDatabase();

  app.listen(env.port, () => {
    console.log(`GoBook API running on http://localhost:${env.port}`);
  });
} catch (error) {
  console.error('Failed to start GoBook API:', error.message);
  process.exit(1);
}
