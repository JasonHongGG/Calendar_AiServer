import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { handleCommand } from './handlers/commandHandler.js';

process.on('uncaughtException', (error) => {
  // Copilot CLI transport can occasionally drop; avoid hard-crashing on known transient stream errors.
  if (error?.code === 'ERR_STREAM_DESTROYED') {
    // eslint-disable-next-line no-console
    console.error('Uncaught exception (ignored):', error);
    return;
  }

  // eslint-disable-next-line no-console
  console.error('Uncaught exception (fatal):', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled rejection:', reason);
});

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - start;
    // eslint-disable-next-line no-console
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${durationMs}ms)`,
    );
  });
  next();
});

app.post('/command', async (req, res) => {
  try {
    const result = await handleCommand(req.body);
    res.status(200).json(result);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('POST /command failed:', error);
    res.status(500).json({ message: error?.message || 'AI command failed' });
  }
});

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`AI server listening on port ${port}`);
});
