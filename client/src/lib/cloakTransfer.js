import { CloakSDK, createSignerFromAdapter } from '@cloak-dev/sdk';
import { PublicKey } from '@solana/web3.js';

/**
 * Shielded send via Cloak. Tries `fullTransfer` when present, else deposit + withdraw.
 */
export async function executeCloakSend({
  connection,
  walletAdapter,
  relayerUrl,
  altAddress,
  amountSol,
  recipientAddress,
}) {
  if (!relayerUrl) throw new Error('Cloak relayer URL not configured');
  const sdk = new CloakSDK({
    connection,
    relayerUrl,
    altAddress,
    verbose: false,
  });
  const signer = createSignerFromAdapter(walletAdapter);
  sdk.setSigner(signer);
  await sdk.initialize();

  const recipient = new PublicKey(recipientAddress);

  if (typeof sdk.fullTransfer === 'function') {
    const res = await sdk.fullTransfer({
      depositAmount: amountSol,
      withdrawAmount: amountSol,
      recipientAddress: recipient,
    });
    if (res?.success) {
      const sig = res.signature || res.signatures?.[0] || `cloak:${Date.now()}`;
      return { result: res, signature: sig };
    }
    if (res?.error) throw new Error(res.error);
  }

  const dep = await sdk.depositSol({ amount: amountSol });
  if (!dep?.success) throw new Error(dep?.error || 'Cloak deposit failed');

  const w = await sdk.withdrawSol({
    recipientAddress: recipient,
    amount: amountSol,
  });
  if (!w?.success) throw new Error(w?.error || 'Cloak withdraw failed');

  const sig = w.signature || w.signatures?.[0] || `cloak:${Date.now()}`;
  return { result: w, signature: sig };
}
