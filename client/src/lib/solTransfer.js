import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';

export async function sendSolTransfer({ connection, fromPubkey, sendTransaction, toAddress, amountSol }) {
  const to = new PublicKey(toAddress);
  const lamports = Math.round(Number(amountSol) * LAMPORTS_PER_SOL);
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: fromPubkey,
      toPubkey: to,
      lamports,
    })
  );
  const sig = await sendTransaction(tx, connection);
  await connection.confirmTransaction(sig, 'confirmed');
  return sig;
}
