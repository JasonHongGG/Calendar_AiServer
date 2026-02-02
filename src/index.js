import express from 'express';
import cors from 'cors';
import { handleCommand } from './handlers/commandHandler.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/command', async (req, res) => {
  try {
    const result = await handleCommand(req.body);
    res.status(200).json(result);
  } catch (error) {
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
