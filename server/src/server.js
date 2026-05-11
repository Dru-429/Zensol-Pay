import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { contactsRouter } from './routes/contacts.js';
import { transfersRouter } from './routes/transfers.js';
import { messagesRouter } from './routes/messages.js';
import { walletRouter } from './routes/wallet.js';

const app = express();
const PORT = process.env.PORT || 4000;
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => res.json({ ok: true, service: 'ZenSol Pay-api' }));

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/transfers', transfersRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/wallet', walletRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`ZenSol Pay API listening on http://localhost:${PORT}`);
});
