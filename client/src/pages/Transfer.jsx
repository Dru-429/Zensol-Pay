import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Send, CheckCircle2, ChevronRight } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import PrivatePaymentSheet from "../components/PrivatePaymentSheet.jsx";

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();
}

function formatFullDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const options = { day: 'numeric', month: 'short' };
  const dateStr = d.toLocaleDateString('en-IN', options);
  const timeStr = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
  return `${dateStr}, ${timeStr}`;
}

function formatDateLabel(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function Transfer() {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [sheet, setSheet] = useState(false);
  const isSelf = id === "self";
  const peerId = isSelf ? user?.id : id;

  const {
    data: peer,
    error: peerErr,
  } = useQuery({
    queryKey: ["userProfile", peerId],
    queryFn: () => api.userProfile(peerId),
    enabled: Boolean(peerId),
  });

  const { data: transfersData } = useQuery({
    queryKey: ["transfersWith", peerId],
    queryFn: () => api.transfersWith(peerId),
    staleTime: 8_000,
    enabled: Boolean(peerId),
  });
  const transfers = transfersData?.transfers || [];

  const { data: messagesData } = useQuery({
    queryKey: ["messagesWith", peerId],
    queryFn: () => api.messagesWith(peerId),
    staleTime: 8_000,
    enabled: Boolean(peerId),
  });
  const messages = messagesData?.messages || [];

  const loadErr = peerErr?.message || "";

  const timeline = useMemo(() => {
    const rawItems = [];
    for (const tr of transfers) {
      rawItems.push({
        kind: "transfer",
        id: tr.id,
        at: tr.createdAt,
        transfer: tr,
      });
    }
    for (const msg of messages) {
      rawItems.push({
        kind: "message",
        id: msg.id,
        at: msg.createdAt,
        message: msg,
      });
    }
    rawItems.sort((a, b) => new Date(a.at) - new Date(b.at));

    const itemsWithSeparators = [];
    let lastDate = null;

    for (const item of rawItems) {
      const currentDate = new Date(item.at).toDateString();
      if (currentDate !== lastDate) {
        itemsWithSeparators.push({
          kind: "separator",
          id: `sep-${item.at}`,
          at: item.at,
          label: formatFullDateTime(item.at),
        });
        lastDate = currentDate;
      }
      itemsWithSeparators.push(item);
    }

    return itemsWithSeparators;
  }, [transfers, messages]);

  const recipientPk =
    peer?.wallets?.find((w) => w.is_primary)?.public_address ||
    peer?.wallets?.[0]?.public_address;

  const sendChat = async () => {
    if (!text.trim()) return;
    sendMessageMutation.mutate(text.trim());
  };

  const sendMessageMutation = useMutation({
    mutationFn: (bodyText) => api.sendMessage({ receiver_id: peerId, text: bodyText }),
    onSuccess: () => {
      setText("");
      queryClient.invalidateQueries({ queryKey: ["messagesWith", peerId] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });

  return (
    <div className="bg-surface mx-auto flex min-h-screen max-w-md flex-col">
      <header className="bg-zinc-50 hover:bg-zinc-200 sticky top-0 z-10 flex items-center gap-3 border-b rounded-b-2xl border-border px-3 py-3 backdrop-blur">
        <Link
          to="/"
          className="rounded-full p-2 text-secondary-text hover:bg-surface-strong"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Link
          to={isSelf ? "/" : `/profile/${id}`}
          className="w-full"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-primary-text">
              {isSelf ? "Self transfer" : peer?.profile?.full_name || `@${peer?.username}`}
            </p>
            <p className="truncate text-xs text-secondary-text">
              {isSelf
                ? "Move funds between your wallets"
                : recipientPk
                  ? `${recipientPk.slice(0, 4)}…${recipientPk.slice(-4)}`
                  : "No pubkey"}
            </p>
          </div>
        </Link>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-4 pb-36">
        {loadErr && (
          <p className="text-center text-sm text-semantic-down">{loadErr}</p>
        )}
        {timeline.map((item) => {
          if (item.kind === "separator") {
            return (
              <div key={item.id} className="flex items-center my-6">
                <div className="flex-1 h-[1px] bg-border-color"></div>
                <span className="px-4 text-[11px] text-secondary-text font-medium">
                  {item.label}
                </span>
                <div className="flex-1 h-[1px] bg-border-color"></div>
              </div>
            );
          }

          if (item.kind === "transfer") {
            const tr = item.transfer;
            const mine = tr.sender_id === user?.id;
            return (
              <div
                key={`t-${tr.id}`}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div className="relative w-full max-w-[280px] overflow-hidden rounded-3xl border border-border-color bg-card shadow-sm transition-transform active:scale-[0.98]">
                  <div className="p-5">
                    <p className="text-[13px] font-medium text-secondary-text mb-1">
                      {mine ? `Payment to ${peer?.profile?.full_name || peer?.username || 'user'}` : 'Payment to you'}
                    </p>
                    <p className="text-3xl font-bold text-primary-text mb-4">
                      {Number(tr.amount_ui)} SOL
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-semantic-up text-white">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </div>
                        <p className="text-[12px] text-secondary-text">
                          Paid • {formatDateLabel(tr.createdAt)}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-secondary-text opacity-40" />
                    </div>
                  </div>
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
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[14px] ${
                  mine 
                    ? "bg-[#0B6BCB] text-white rounded-tr-none" 
                    : "bg-[#F3F6F9] text-primary-text border border-border-color/30 rounded-tl-none"
                }`}
              >
                <p>{msg.text}</p>
                <p className={`mt-1 text-[10px] text-right ${mine ? "text-white/70" : "text-secondary-text/70"}`}>
                  {formatTime(msg.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <footer className="bg-surface/80 border-t-2 border-gray-200 rounded-xl fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-3 pb-safe backdrop-blur-md z-20">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <button
            type="button"
            onClick={() => setSheet(true)}
            className="h-[48px] rounded-[24px] bg-[#0B6BCB] px-8 text-sm font-semibold text-white active:scale-95 transition-transform hover:scale-105"
          >
            Pay
          </button>
          
          <div className="relative flex-1 flex items-center">
            <input
              className="w-full rounded-[24px] bg-[#F0F4F8] border-none px-5 py-3.5 text-sm text-primary-text outline-none placeholder:text-secondary-text/60"
              placeholder="Message…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendChat()}
            />
            <button
              type="button"
              onClick={sendChat}
              disabled={!text.trim()}
              className="absolute right-2 p-2 text-[#0B6BCB] disabled:text-secondary-text/30"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </footer>

      <PrivatePaymentSheet
        open={sheet}
        onClose={() => setSheet(false)}
        peerId={peerId}
        peerUsername={isSelf ? user?.username : peer?.username}
        peerFullName={isSelf ? user?.profile?.full_name : peer?.profile?.full_name}
        peerAvatar={isSelf ? user?.profile?.avatar_url : peer?.profile?.avatar_url}
        recipientPubkey={recipientPk}
        recipientWallets={peer?.wallets || []}
        onComplete={() => {
          queryClient.invalidateQueries({ queryKey: ["transfersWith", peerId] });
          queryClient.invalidateQueries({ queryKey: ["messagesWith", peerId] });
          queryClient.invalidateQueries({ queryKey: ["contacts"] });
        }}
      />
    </div>
  );
}
