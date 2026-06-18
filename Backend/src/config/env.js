import dotenv from 'dotenv';

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 5000),
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  mongodbUri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/gobook',
  mongodbDbName: process.env.MONGODB_DB_NAME ?? 'gobook',
  jwtSecret: process.env.JWT_SECRET ?? 'change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  groqApiKey: process.env.GROQ_API_KEY ?? '',
  groqModel: process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
};
