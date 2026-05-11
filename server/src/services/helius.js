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
      id: 'ZenSol Pay',
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

export async function fetchHeliusAddressProfile(address) {
  const key = heliusApiKey();
  if (!key) {
    return {
      snsDomains: [],
      socials: {},
      activity: { lastActiveText: 'Unknown', txCount30d: 0 },
      source: 'missing-api-key',
    };
  }

  const [signatures, solBalanceLamports, socials, snsDomains] = await Promise.all([
    rpcCall('getSignaturesForAddress', [address, { limit: 200 }]).catch(() => []),
    rpcCall('getBalance', [address]).catch(() => ({ value: 0 })),
    fetch(`${HELIUS_BASE}/v0/addresses/${address}/socials?api-key=${key}`)
      .then(async (r) => (r.ok ? r.json() : {}))
      .catch(() => ({})),
    fetch(`${HELIUS_BASE}/v0/addresses/${address}/names?api-key=${key}`)
      .then(async (r) => (r.ok ? r.json() : []))
      .catch(() => []),
  ]);

  const nowSec = Math.floor(Date.now() / 1000);
  const threshold30d = nowSec - 30 * 24 * 60 * 60;
  const txCount30d = (signatures || []).filter((s) => (s.blockTime || 0) >= threshold30d).length;
  const latest = signatures?.[0]?.blockTime || null;
  let lastActiveText = 'No recent activity';
  if (latest) {
    const diffHours = Math.max(0, Math.floor((nowSec - latest) / 3600));
    if (diffHours < 1) lastActiveText = 'Last active less than 1 hour ago';
    else if (diffHours < 24) lastActiveText = `Last active ${diffHours} hours ago`;
    else lastActiveText = `Last active ${Math.floor(diffHours / 24)} days ago`;
  }

  return {
    snsDomains: Array.isArray(snsDomains) ? snsDomains : [],
    socials: socials || {},
    activity: {
      lastActiveText,
      txCount30d,
    },
    solBalance: (solBalanceLamports?.value || 0) / 1e9,
    source: 'helius',
  };
}
