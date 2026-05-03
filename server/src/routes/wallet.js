import { Router } from 'express';
import { PublicKey } from '@solana/web3.js';
import { fetchSvmBalances, summarizePortfolio } from '../services/dune.js';
import { authMiddleware } from '../middleware/auth.js';
import { getCloakConfig, probeCloakRelayer } from '../services/cloak.js';

export const walletRouter = Router();

walletRouter.get('/balances/:address', authMiddleware, async (req, res) => {
  try {
    const addr = req.params.address;
    try {
      new PublicKey(addr);
    } catch {
      return res.status(400).json({ error: 'Invalid Solana address' });
    }
    const data = await fetchSvmBalances(addr);
    const summary = summarizePortfolio(data);
    res.json(summary);
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: e.message || 'Balance fetch failed' });
  }
});

walletRouter.get('/cloak-config', (_req, res) => {
  const cfg = getCloakConfig();
  res.json({
    relayerUrl: cfg.relayerUrl || null,
    altAddress: cfg.altAddress,
    rpcUrl: cfg.rpcUrl,
    cluster: cfg.cluster,
    configured: Boolean(cfg.relayerUrl),
  });
});

walletRouter.get('/cloak-health', async (_req, res) => {
  const probe = await probeCloakRelayer();
  res.json(probe);
});
