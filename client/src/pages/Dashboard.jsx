import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { encodeURL } from "@solana/pay";
import { PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { QRCodeSVG } from "qrcode.react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  QrCode,
  Wallet,
  LogOut,
  ChevronRight,
  ScanLine,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [balanceOpen, setBalanceOpen] = useState(false);
  const [balanceData, setBalanceData] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceErr, setBalanceErr] = useState("");
  const [qrOpen, setQrOpen] = useState(false);
  const [payUrl, setPayUrl] = useState("");

  const { data: contactsData } = useQuery({
    queryKey: ["contacts"],
    queryFn: api.contacts,
  });
  const contacts = contactsData?.contacts || [];

  const recent = useMemo(() => {
    const computed = contacts.filter((c) => c.is_recent).slice(0, 4);
    return computed;
  }, [contacts]);

  const openReceiveQr = () => {
    const pk =
      publicKey?.toBase58() ||
      user?.wallets?.find((w) => w.is_primary)?.public_address ||
      user?.wallets?.[0]?.public_address;
    if (!pk) {
      setBalanceErr("Connect wallet or add a primary address");
      return;
    }
    const url = encodeURL({
      recipient: new PublicKey(pk),
      amount: new BigNumber(0),
      label: "SolPay",
      message: `Pay @${user?.username}`,
    });
    setPayUrl(url.toString());
    setQrOpen(true);
  };

  const checkBalance = async () => {
    navigate('/wallet');
  };

  return (
    <div className="mx-auto min-h-screen max-w-md pb-28 bg-surface">
      <header className="sticky top-0 z-10 border-b border-border-soft bg-surface px-4 pb-3 pt-4 backdrop-blur-md">
        <div className="mb-3 flex items-center justify-between">
          <Link to={`/profile/${user?.id}`} className=" flex items-center gap-3">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-semantic-up/20 to-accent/10 text-lg font-bold text-accent">
                {(user?.profile?.full_name || `@${user?.username}`)
                  .slice(0, 1)
                  .toUpperCase()}
              </div>
            </div>
            <div className="flex flex-col">
              <p className="text-xs text-secondary-text">Hello</p>
              <p className="text-lg font-semibold text-primary-text">
                {user?.profile?.full_name || `@${user?.username}`}
              </p>
            </div>
          </Link>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setVisible(true)}
              className="rounded-full border border-border-color bg-card p-2.5 text-secondary-text hover:bg-surface-strong"
              title="Wallet"
            >
              <Wallet className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => logout()}
              className="rounded-full border border-border-color bg-card p-2.5 text-secondary-text hover:bg-surface-strong"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-text" />
            <button
              type="button"
              onClick={() => navigate("/search")}
              className="w-full rounded-full border border-border-color bg-card py-2.5 pl-10 pr-4 text-sm text-secondary-text outline-none ring-accent focus:ring-1"
            >
              Search @username, name or pubkey
            </button>
          </div>
          <button
            type="button"
            onClick={openReceiveQr}
            className="rounded-full border border-border-color bg-card p-2.5 hover:bg-surface-strong"
          >
            <QrCode className="h-5 w-5 text-accent" />
          </button>
          <button
            type="button"
            className="rounded-full border border-border-color bg-card p-2.5 hover:bg-surface-strong"
          >
            <ScanLine className="h-5 w-5 text-secondary-text" />
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <span className="rounded-full bg-surface-strong px-3 py-1 text-xs text-secondary-text border border-border-soft">
            Trust {user?.profile?.trust_score ?? "—"}
          </span>
          {connected && (
            <span className="rounded-full bg-semantic-up/10 px-3 py-1 text-xs text-semantic-up border border-semantic-up/30">
              Wallet linked
            </span>
          )}
        </div>
      </header>

      <section className="px-4 pt-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium text-secondary-text">Recent</h2>
        </div>
        <div className="scrollbar-hide flex gap-4 overflow-x-auto pb-2">
          {recent.length === 0 && (
            <p className="text-sm text-muted-text">
              No recent contacts — run server seed
            </p>
          )}
          {recent.map((c) => (
            <Link
              key={c.id}
              to={`/profile/${c.contact_user_id}`}
              className="flex w-20 shrink-0 flex-col items-center gap-1"
            >
              <div className="avatar-gradient flex h-16 w-16 items-center justify-center rounded-full text-lg font-bold text-accent">
                {(c.display_name || c.contactUser?.username || "?")
                  .slice(0, 1)
                  .toUpperCase()}
              </div>
              <span className="max-w-full truncate text-center text-xs text-secondary-text">
                {c.display_name || c.contactUser?.profile?.full_name || `@${c.contactUser?.username}`}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-4 pt-6">
        <h2 className="mb-3 text-sm font-medium text-secondary-text">People</h2>
        <div className="space-y-2">
          {contacts.map((c) => (
            <Link
              key={c.id}
              to={`/profile/${c.contact_user_id}`}
              className="flex items-center gap-3 rounded-2xl border border-border-soft bg-card px-3 py-3 hover:bg-surface-strong transition-colors"
            >
              <div className="avatar-gradient flex h-11 w-11 items-center justify-center rounded-full text-lg font-bold text-accent">
                {(c.display_name || c.contactUser?.username || "?")
                  .slice(0, 1)
                  .toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-primary-text">
                  {c.display_name || c.contactUser?.profile?.full_name}
                </p>
                <p className="truncate text-xs text-secondary-text">
                  @{c.contactUser?.username}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-text" />
            </Link>
          ))}
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 border-t border-border-soft bg-surface p-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-md gap-3">
          <button
            type="button"
            onClick={checkBalance}
            className="flex-1 rounded-2xl bg-accent py-3.5 text-sm font-semibold text-white shadow-lg shadow-accent/20 hover:bg-blue-600 transition-colors"
          >
            Check balance
          </button>
        </div>
      </div>

      

      {qrOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-3xl border border-border-color bg-surface p-6 text-center shadow-xl">
            <h3 className="mb-4 font-semibold text-primary-text">Receive with Solana Pay</h3>
            <div className="mx-auto mb-4 flex justify-center rounded-2xl bg-white p-3">
              <QRCodeSVG value={payUrl} size={200} />
            </div>
            <p className="mb-4 break-all text-xs text-secondary-text">{payUrl}</p>
            <button
              type="button"
              onClick={() => setQrOpen(false)}
              className="rounded-full bg-surface-strong border border-border-color px-6 py-2 text-sm text-primary-text hover:bg-border-soft transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
