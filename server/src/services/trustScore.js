import fetch from 'node-fetch';
import { prisma } from '../lib/prisma.js';
import { fetchSvmBalances, summarizePortfolio } from './dune.js';

const HELIUS_BASE = 'https://api.helius.xyz';

function heliusApiKey() {
  return process.env.HELIUS_API_KEY || '';
}

function heliusRpcUrl() {
  const key = heliusApiKey();
  if (!key) return null;
  return `https://mainnet.helius-rpc.com/?api-key=${key}`;
}

async function rpcCall(method, params = []) {
  const url = heliusRpcUrl();
  if (!url) throw new Error('HELIUS_API_KEY is not configured');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'solpay',
      method,
      params,
    }),
  });
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json?.error?.message || `Helius RPC error for ${method}`);
  }
  return json.result;
}

export async function calculateTrustScore(address) {
  try {
    const apiKey = heliusApiKey();
    if (!apiKey) throw new Error('Helius API key missing');

    // 1. Fetch Balances for Diversity (D)
    let diversityScore = 0;
    try {
      const balancesRaw = await fetchSvmBalances(address);
      const portfolio = summarizePortfolio(balancesRaw);
      const uniqueTokens = portfolio.tokens.filter(t => t.balance > 0).length;
      // Max out diversity at 20 unique tokens/NFTs
      diversityScore = Math.min(uniqueTokens / 20, 1) * 100;
    } catch (e) {
      console.error('Failed to fetch Dune balances for Diversity:', e);
    }

    // 2. Fetch up to 1000 Signatures to calculate Age (A) and Success Rate
    const signatures = await rpcCall('getSignaturesForAddress', [address, { limit: 1000 }]).catch(() => []);
    
    let ageScore = 0;
    let successRate = 1;
    let recentSigsToFetch = [];

    if (signatures.length > 0) {
      // Calculate Success Rate over last 90 days
      const nowSec = Math.floor(Date.now() / 1000);
      const threshold90d = nowSec - 90 * 24 * 60 * 60;
      
      const sigs90d = signatures.filter(s => (s.blockTime || 0) >= threshold90d);
      if (sigs90d.length > 0) {
        const successful = sigs90d.filter(s => s.err === null).length;
        successRate = successful / sigs90d.length;
      }

      // Calculate Age (A) based on the oldest transaction fetched
      const oldestTx = signatures[signatures.length - 1];
      if (oldestTx && oldestTx.blockTime) {
        const monthsOld = (nowSec - oldestTx.blockTime) / (30 * 24 * 60 * 60);
        // Normalize age: max out at 24 months (2 years)
        ageScore = Math.min(monthsOld / 24, 1) * 100;
      }

      // Prepare up to 100 recent signatures for Enriched volume/protocol parsing
      recentSigsToFetch = sigs90d.slice(0, 100).map(s => s.signature);
    }

    // 3. Fetch Enriched Transactions for Volume (V) and Protocol (P)
    let volumeScore = 0;
    let protocolScore = 0;

    if (recentSigsToFetch.length > 0) {
      try {
        const res = await fetch(`${HELIUS_BASE}/v0/transactions/?api-key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactions: recentSigsToFetch }),
        });
        
        if (res.ok) {
          const enrichedTxs = await res.json();
          let volumeUsdEstimate = 0;
          let blueChipInteractions = 0;

          const BLUE_CHIPS = ['JUPITER', 'MAGIC_EDEN', 'TENSOR', 'MANGO', 'KAMINO', 'RAYDIUM', 'ORCA', 'DRIFT'];

          for (const tx of enrichedTxs) {
            if (BLUE_CHIPS.includes(tx.source)) {
              blueChipInteractions++;
            }

            // Estimate volume (Native SOL)
            for (const xfer of tx.nativeTransfers || []) {
              volumeUsdEstimate += (xfer.amount / 1e9) * 140; // Rough $140 SOL price for estimation
            }
            // Estimate volume (Token Transfers, assuming USDC has 6 decimals and symbol USDC)
            for (const xfer of tx.tokenTransfers || []) {
              if (xfer.mint === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') { // USDC mainnet mint
                volumeUsdEstimate += xfer.tokenAmount;
              }
            }
          }

          // Normalize Volume (V): log scale, full points at $100,000 volume
          if (volumeUsdEstimate > 0) {
            volumeScore = Math.min(Math.log10(volumeUsdEstimate + 1) / 5, 1) * 100;
          }

          // Normalize Protocol (P): full points at 10 blue-chip interactions in recent history
          protocolScore = Math.min(blueChipInteractions / 10, 1) * 100;
        }
      } catch (e) {
        console.error('Failed to fetch Enriched TXs:', e);
      }
    }

    // Weights: w1 (Age) = 20%, w2 (Volume) = 30%, w3 (Diversity) = 20%, w4 (Protocol) = 30%
    const baseScore = (0.2 * ageScore) + (0.3 * volumeScore) + (0.2 * diversityScore) + (0.3 * protocolScore);
    
    // Apply Success Rate Penalty
    // If SR is 100%, multiplier is 1. If 0%, multiplier is 0.5.
    const finalScore = Math.round(baseScore * (0.5 + 0.5 * successRate));

    return {
      score: Math.min(Math.max(finalScore, 0), 100),
      metrics: { ageScore, volumeScore, diversityScore, protocolScore, successRate }
    };
  } catch (error) {
    console.error('Trust Score Calculation Error:', error);
    return { score: 50, metrics: null }; // Default fallback
  }
}

export async function refreshUserTrustScore(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true, wallets: { where: { is_primary: true } } }
  });

  if (!user || !user.wallets.length) return null;

  const now = new Date();
  const lastUpdated = user.profile?.trust_score_updated_at;
  
  // Refresh every 3 days
  if (lastUpdated) {
    const daysSince = (now - lastUpdated) / (1000 * 60 * 60 * 24);
    if (daysSince < 3) return user.profile.trust_score; // Still fresh
  }

  const primaryWallet = user.wallets[0].public_address;
  const result = await calculateTrustScore(primaryWallet);

  await prisma.userProfile.update({
    where: { userId: user.id },
    data: { 
      trust_score: result.score,
      trust_score_updated_at: now
    }
  });

  return result.score;
}
