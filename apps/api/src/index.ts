import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { routes, errorHandler } from './routes';
import { PORT, CLIENT_URL, validateEnv } from './config/env';
import { connectDatabase } from './lib/prisma';
import { createServer } from 'http';
import { setupSocketIO } from './sockets';
import { startOverdueJob } from './jobs/overdue';

const app: Application = express();

app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.use('/api', routes);

app.use(errorHandler);

async function start() {
  validateEnv();
  await connectDatabase();
  startOverdueJob();
  const server = createServer(app);
  setupSocketIO(server);
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch(console.error);

export default app;
