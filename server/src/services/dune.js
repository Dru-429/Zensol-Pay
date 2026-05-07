const DUNE_SIM_BASE = 'https://api.sim.dune.com';

/**
 * Fetches SVM balances for a wallet via Dune Sim API.
 * @param {string} address - Solana public key (base58)
 * @param {{ chains?: string }} [opts]
 */
export async function fetchSvmBalances(address, opts = {}) {
  const apiKey = process.env.DUNE_SIM_API_KEY;
  if (!apiKey) {
    throw new Error('DUNE_SIM_API_KEY is not configured');
  }

  const chains = opts.chains ?? 'solana';
  const url = new URL(`${DUNE_SIM_BASE}/beta/svm/balances/${encodeURIComponent(address)}`);
  url.searchParams.set('chains', chains);
  url.searchParams.set('limit', '50');

  const res = await fetch(url.toString(), {
    headers: { 'X-Sim-Api-Key': apiKey },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Dune Sim error ${res.status}: ${text}`);
  }

  return res.json();
}

/**
 * Summarize SOL + USDC (and total USD) from Dune response for dashboard display.
 */
export function summarizePortfolio(balancesResponse) {
  const balances = balancesResponse.balances ?? [];
  let solBalance = 0;
  let solUsd = 0;
  let usdcBalance = 0;
  let usdcUsd = 0;
  let totalUsd = 0;
  const tokens = [];

  for (const b of balances) {
    const symbol = (b.symbol || '').toUpperCase();
    const val = typeof b.value_usd === 'number' ? b.value_usd : 0;
    totalUsd += val;
    tokens.push({
      mint: b.address || b.token_address || b.mint || null,
      symbol: b.symbol || b.token_symbol || 'Token',
      name: b.name || b.token_name || b.symbol || 'Token',
      balance: parseFloat(b.balance || b.amount || '0') || 0,
      value_usd: val,
      price_usd: typeof b.price_usd === 'number' ? b.price_usd : null,
      change_24h: typeof b.change_24h === 'number' ? b.change_24h : null,
      logo_url: b.logo_url || b.logo || b.image || null,
      verified: Boolean(b.verified),
      raw: b,
    });

    if (b.address === 'native' || symbol === 'SOL') {
      solBalance = parseFloat(b.balance || '0') || 0;
      solUsd = val;
    }
    if (symbol === 'USDC') {
      usdcBalance = parseFloat(b.balance || '0') || 0;
      usdcUsd = val;
    }
  }

  return {
    wallet_address: balancesResponse.wallet_address,
    sol: { balance: solBalance, value_usd: solUsd },
    usdc: { balance: usdcBalance, value_usd: usdcUsd },
    total_usd: totalUsd,
    tokens: tokens.sort((a, b) => (b.value_usd || 0) - (a.value_usd || 0)),
    raw: balancesResponse,
  };
}
