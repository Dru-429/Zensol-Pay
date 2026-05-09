import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import PrivatePaymentSheet from "../components/PrivatePaymentSheet.jsx";

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function Transfer() {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [sheet, setSheet] = useState(false);

  const {
    data: peer,
    error: peerErr,
  } = useQuery({
    queryKey: ["userProfile", id],
    queryFn: () => api.userProfile(id),
  });

  const { data: transfersData } = useQuery({
    queryKey: ["transfersWith", id],
    queryFn: () => api.transfersWith(id),
    staleTime: 8_000,
  });
  const transfers = transfersData?.transfers || [];

  const { data: messagesData } = useQuery({
    queryKey: ["messagesWith", id],
    queryFn: () => api.messagesWith(id),
    staleTime: 8_000,
  });
  const messages = messagesData?.messages || [];

  const loadErr = peerErr?.message || "";

  const timeline = useMemo(() => {
    const items = [];
    for (const tr of transfers) {
      items.push({
        kind: "transfer",
        id: tr.id,
        at: tr.createdAt,
        transfer: tr,
      });
    }
    for (const msg of messages) {
      items.push({
        kind: "message",
        id: msg.id,
        at: msg.createdAt,
        message: msg,
      });
    }
    items.sort((a, b) => new Date(a.at) - new Date(b.at));
    return items;
  }, [transfers, messages]);

  const recipientPk =
    peer?.wallets?.find((w) => w.is_primary)?.public_address ||
    peer?.wallets?.[0]?.public_address;

  const sendChat = async () => {
    if (!text.trim()) return;
    sendMessageMutation.mutate(text.trim());
  };

  const sendMessageMutation = useMutation({
    mutationFn: (bodyText) => api.sendMessage({ receiver_id: id, text: bodyText }),
    onSuccess: () => {
      setText("");
      queryClient.invalidateQueries({ queryKey: ["messagesWith", id] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });

  return (
    <div className="bg-primary mx-auto flex min-h-screen max-w-md flex-col">
      <header className="bg-primary sticky top-0 z-10 flex items-center gap-3 border-b border-theme-soft px-3 py-3 backdrop-blur">
        <Link
          to="/"
          className="rounded-full p-2 text-muted hover:bg-white/5"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">
            {peer?.profile?.full_name || `@${peer?.username}`}
          </p>
          <p className="truncate text-xs text-muted">
            {recipientPk
              ? `${recipientPk.slice(0, 4)}…${recipientPk.slice(-4)}`
              : "No pubkey"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSheet(true)}
          className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-surface"
        >
          Pay
        </button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-4 pb-36">
        {loadErr && (
          <p className="text-center text-sm text-red-400">{loadErr}</p>
        )}
        {timeline.map((item) => {
          if (item.kind === "transfer") {
            const tr = item.transfer;
            const mine = tr.sender_id === user?.id;
            return (
              <div
                key={`t-${tr.id}`}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                    mine
                      ? "rounded-br-md btn-accent"
                      : "rounded-bl-md bg-secondary text-white"
                  }`}
                >
                  <p className="font-semibold">
                    {tr.amount_ui} SOL
                    {tr.is_private ? " · 🔒" : ""}
                  </p>
                  <p className="text-xs opacity-80">{tr.status}</p>
                  {tr.tx_hash && (
                    <p className="mt-1 truncate text-[10px] opacity-70">
                      {tr.tx_hash}
                    </p>
                  )}
                  <p className="mt-1 text-[10px] opacity-60">
                    {formatTime(tr.createdAt)}
                  </p>
                </div>
              </div>
            );
          }
          const msg = item.message;
          const mine = msg.sender_id === user?.id;
          return (
            <div
              key={`m-${msg.id}`}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  mine ? "rounded-br-md bg-white/10" : "rounded-bl-md bg-secondary"
                }`}
              >
                <p>{msg.text}</p>
                <p className="mt-1 text-[10px] text-muted">
                  {formatTime(msg.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <footer className="bg-primary fixed bottom-0 left-0 right-0 border-t border-theme p-3 backdrop-blur">
        <div className="mx-auto flex max-w-md gap-2">
          <button
            type="button"
            onClick={() => setSheet(true)}
            className="rounded-2xl bg-accent2 px-5 text-white"
          >
            Pay
          </button>
          <input
            className="flex-1 rounded-full border border-theme bg-secondary px-4 py-3 text-sm text-secondary outline-none ring-theme focus:ring-1"
            placeholder="Message…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendChat()}
          />
          <button
            type="button"
            onClick={sendChat}
            className="rounded-full bg-white/10 px-4 py-3 text-sm"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </footer>

      <PrivatePaymentSheet
        open={sheet}
        onClose={() => setSheet(false)}
        peerId={id}
        peerUsername={peer?.username}
        peerFullName={peer?.profile?.full_name}
        recipientPubkey={recipientPk}
        recipientWallets={peer?.wallets || []}
        onComplete={() => {
          queryClient.invalidateQueries({ queryKey: ["transfersWith", id] });
          queryClient.invalidateQueries({ queryKey: ["messagesWith", id] });
          queryClient.invalidateQueries({ queryKey: ["contacts"] });
        }}
      />
    </div>
  );
}
