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
  Coins,
  DollarSign,
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
      <header className="sticky top-0 z-10 border-b-2 border-border bg-surface px-4 pb-3 pt-4 backdrop-blur-md rounded-2xl">
        <div className="mb-3 flex items-center justify-between">
          <Link to={`/profile/${user?.id}`} className=" flex items-center gap-3">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-200 text-lg font-bold text-accent">
                {(user?.profile?.full_name || `@${user?.username}`)
                  .slice(0, 1)
                  .toUpperCase()}
              </div>
            </div>
            <div className="flex flex-col">
              <p className="text-lg font-semibold text-primary-text">
                {user?.profile?.full_name || `@${user?.username}`}
              </p>
              <div className="flex gap-1 -mt-1">
                {connected && (
                  <span className="text-xs text-semantic-up tracking-tigher">
                    Wallet linked
                  </span>
                )}
              </div>
            </div>
          </Link>
        </div>

        <div className="flex gap-2 mt-3">
          <div className="relative flex-1">
            <button
              type="button"
              onClick={() => navigate("/search")}
              className="w-full rounded-full relative border border-border-color bg-card py-2.5 pl-3 pr-4 text-sm text-secondary-text outline-none ring-accent focus:ring-2"
            >
              <span className="relative -left-16">
                Search @username, name or pubkey
              </span>
            </button>
            <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary-text" />
          </div>
        </div>

         //controles
        <div className="flex w-full justify-between mb-3">
          <button
            type="button"
            onClick={openReceiveQr}
            className="rounded-xl border border-border-color bg-card p-3 hover:bg-surface-strong h-20 w-18 flex justify-center items-center flex-col text-secondary-text hover:text-accent"
          >
            <QrCode className="h-10 w-10" />
          </button>

          <button
            type="button"
            onClick={() => setVisible(true)}
            className="rounded-xl border border-border-color bg-card p-3 text-secondary-text hover:bg-surface-strong hover:text-accent h-20 w-18 flex justify-center items-center"
            title="Wallet"
          >
            <Wallet className="h-10 w-10" />
          </button>

          <button
            type="button"
            onClick={checkBalance}
            className="rounded-xl border border-border-color bg-card p-3 text-secondary-text hover:bg-surface-strong hover:text-accent h-20 w-18 flex justify-center items-center"
            title="Wallet"
          >
            {/* <Coins className="h-8 w-8" /> */}
            <DollarSign className="h-10 w-10"/>
          
          </button>

          <div
            className="rounded-xl border border-border-color bg-card p-1 text-secondary-text h-20 w-18 flex flex-col justify-center items-center"
            title="Wallet"
          >
            <span className="text-xl font-bold text-accent">
              {user?.profile?.trust_score ?? "—"}
            </span>

            <span className="text-xs tracking-tighter text-accent">
              Trust Score
            </span>
          </div>



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
        <h2 className="mb-3 text-sm font-medium text-secondary-text">Contacts</h2>
        <div className="">
          {user && (
            <Link
              key="self"
              to="/transfer/self"
              className="flex items-center gap-3 border-b border-border-soft px-3 py-3 hover:bg-surface-strong transition-colors"
            >
              <div className="avatar-gradient flex h-11 w-11 items-center justify-center rounded-full text-lg font-bold text-accent ">
                {((user?.profile?.full_name || user?.username || "?")
                  .slice(0, 1)
                  .toUpperCase())}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-primary-text">
                  {user?.profile?.full_name || user?.username} (self)
                </p>
                <p className="truncate text-xs text-secondary-text">
                  @{user?.username}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-text" />
            </Link>
          )}
          {contacts.filter(c => c.contact_user_id !== user?.id).map((c) => (
            <Link
              key={c.id}
              to={`/transfer/${c.contact_user_id}`}
              className="flex items-center gap-3 border-b border-border-soft px-3 py-3 hover:bg-surface-strong transition-colors"
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

      <div className="fixed max-w-md bottom-0 -translate-x-1/2 left-1/2 px-10-4 border-t border-border-soft p-4 backdrop-blur-md">
        <div className="mx-auto flex w-full gap-3 px-10">
          <button
            type="button"
            onClick={checkBalance}
            className="flex-1 rounded-2xl bg-accent py-3.5 text-sm font-semibold text-white shadow-lg shadow-accent/20 hover:bg-blue-600 transition-colors"
          >
            Balance
          </button>
        </div>
      </div>



      {qrOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-3xl border border-border-color bg-surface p-6 text-center shadow-xl">
            <h3 className="mb-4 font-semibold text-primary-text">Receive with Sol Pay</h3>
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
