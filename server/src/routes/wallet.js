import { Router } from 'express';
import { PublicKey } from '@solana/web3.js';
import { fetchSvmBalances, summarizePortfolio } from '../services/dune.js';
import { authMiddleware } from '../middleware/auth.js';
import { getCloakConfig, probeCloakRelayer } from '../services/cloak.js';
import { fetchHeliusAddressProfile } from '../services/helius.js';
import { getOrSet } from '../lib/cache.js';

export const walletRouter = Router();

walletRouter.get('/balances/:address', authMiddleware, async (req, res) => {
  try {
    const addr = req.params.address;
    try {
      new PublicKey(addr);
    } catch {
      return res.status(400).json({ error: 'Invalid Solana address' });
    }
    const key = `wallet:balances:${addr}`;
    const summary = await getOrSet(key, 45, async () => {
      const data = await fetchSvmBalances(addr);
      return summarizePortfolio(data);
    });
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

walletRouter.get('/lookup/:address', authMiddleware, async (req, res) => {
  try {
    const address = req.params.address;
    try {
      new PublicKey(address);
    } catch {
      return res.status(400).json({ error: 'Invalid Solana address' });
    }

    const [portfolioRaw, heliusProfile] = await Promise.all([
      getOrSet(`wallet:balancesRaw:${address}`, 60, () => fetchSvmBalances(address)).catch(() => null),
      getOrSet(`wallet:helius:${address}`, 60, () => fetchHeliusAddressProfile(address)),
    ]);

    const portfolio = portfolioRaw ? summarizePortfolio(portfolioRaw) : null;
    const topHoldings = (portfolio?.tokens || []).slice(0, 6).map((t) => ({
      symbol: t.symbol,
      name: t.name,
      balance: t.balance,
      value_usd: t.value_usd,
    }));

    res.json({
      address,
      sns_domains: heliusProfile.snsDomains || [],
      socials: heliusProfile.socials || {},
      activity: heliusProfile.activity,
      sol_balance: portfolio?.sol?.balance ?? heliusProfile.solBalance ?? 0,
      total_usd: portfolio?.total_usd ?? null,
      top_holdings: topHoldings,
    });
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: e.message || 'Lookup failed' });
  }
});
