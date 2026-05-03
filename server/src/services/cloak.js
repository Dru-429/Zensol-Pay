import { CloakSDK, Connection } from '@cloak-dev/sdk';

/**
 * Server-side Cloak helpers for health-check / relayer verification.
 * Production shielded sends should run in the browser with the user's wallet
 * (see client PrivatePaymentFlow). This module validates config at boot.
 */

export function getCloakConfig() {
  const relayerUrl = process.env.CLOAK_RELAYER_URL || '';
  const cluster = process.env.SOLANA_CLUSTER || 'mainnet-beta';
  const altMainnet = 'G1Wc4i6fqiEY1UYn27y6E6RFCBSB1cQ256pAzwrmbiPj';
  const altDevnet = 'Dy1kWrcceThLo9ywoMH2MpWTsBe9pxsv3fCcTj3sSDK9';
  const altAddress = process.env.CLOAK_ALT_ADDRESS || (cluster === 'devnet' ? altDevnet : altMainnet);
  const rpcUrl =
    process.env.SOLANA_RPC_URL ||
    (cluster === 'devnet' ? 'https://api.devnet.solana.com' : 'https://api.mainnet-beta.solana.com');

  return { relayerUrl, altAddress, rpcUrl, cluster };
}

/**
 * Lightweight connectivity probe (does not move funds).
 */
export async function probeCloakRelayer() {
  const { relayerUrl, altAddress, rpcUrl } = getCloakConfig();
  if (!relayerUrl) {
    return { ok: false, error: 'CLOAK_RELAYER_URL not set' };
  }
  try {
    const connection = new Connection(rpcUrl, 'confirmed');
    const sdk = new CloakSDK({
      connection,
      relayerUrl,
      altAddress,
      verbose: false,
    });
    await sdk.initialize();
    return { ok: true, relayerUrl, altAddress, rpcUrl };
  } catch (e) {
    return { ok: false, error: e.message || String(e) };
  }
}
