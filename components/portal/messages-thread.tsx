"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  Loader2,
  Smile,
  Reply,
  MoreHorizontal,
  Pencil,
  Trash2,
  CornerDownRight,
  Check,
  X,
  AtSign,
} from "lucide-react";
import {
  sendMessage,
  toggleMessageReaction,
  editMessage,
  deleteMessage,
  searchProjectMembers,
} from "@/features/clients/portal-actions";

type Reaction = {
  emoji: string;
  users: string[];
};

export type Message = {
  _id: string;
  body: string;
  attachments: string[];
  sender: { _id?: string; name: string; role: string };
  senderId: string;
  parent?: string;
  mentions: string[];
  reactions: Reaction[];
  editedAt?: string;
  createdAt: string;
};

const QUICK_EMOJI = ["👍", "❤️", "🔥", "🎉", "👀", "🙏"];

export function MessagesThread({
  projectId,
  messages,
  currentUserId,
}: {
  projectId: string;
  messages: Message[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mentions, setMentions] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Group messages — top-level + replies map
  const { topLevel, replyMap } = useMemo(() => {
    const top: Message[] = [];
    const map = new Map<string, Message[]>();
    for (const m of messages) {
      if (m.parent) {
        if (!map.has(m.parent)) map.set(m.parent, []);
        map.get(m.parent)!.push(m);
      } else {
        top.push(m);
      }
    }
    // Sort replies chronologically
    for (const arr of map.values()) {
      arr.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    return { topLevel: top, replyMap: map };
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    setError(null);
    const res = await sendMessage({
      project: projectId,
      body: body.trim(),
      attachments: [],
      parent: replyTo?._id,
      mentions,
    });
    setSending(false);
    if (res.ok) {
      setBody("");
      setReplyTo(null);
      setMentions([]);
      router.refresh();
    } else {
      setError(res.error);
    }
  }

  return (
    <div className="border border-ink-800 rounded-sm flex flex-col h-[600px]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        {topLevel.length === 0 ? (
          <div className="h-full grid place-items-center text-center">
            <div>
              <p className="text-bone-300 mb-2">No messages yet.</p>
              <p className="text-xs text-bone-400">Start the conversation below. Use <kbd className="px-1 border border-ink-700 rounded font-mono">@</kbd> to mention someone.</p>
            </div>
          </div>
        ) : (
          topLevel.map((m) => (
            <MessageItem
              key={m._id}
              message={m}
              replies={replyMap.get(m._id) ?? []}
              currentUserId={currentUserId}
              isEditing={editingId === m._id}
              setEditingId={setEditingId}
              onReply={() => {
                setReplyTo(m);
                inputRef.current?.focus();
              }}
              onChanged={() => router.refresh()}
              replyMap={replyMap}
              setReplyTo={setReplyTo}
            />
          ))
        )}
      </div>

      {replyTo && (
        <div className="border-t border-ink-800 bg-ink-950 px-4 py-2 flex items-center gap-2">
          <Reply className="h-3.5 w-3.5 text-fire" />
          <p className="text-xs text-bone-300 flex-1 truncate">
            Replying to <span className="text-fire">{replyTo.sender.name}</span>: {replyTo.body}
          </p>
          <button
            onClick={() => setReplyTo(null)}
            className="text-bone-400 hover:text-bone p-1 rounded-sm hover:bg-ink-900"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <Composer
        ref={inputRef}
        body={body}
        setBody={setBody}
        mentions={mentions}
        setMentions={setMentions}
        projectId={projectId}
        sending={sending}
        onSubmit={send}
        replyTo={replyTo}
      />

      {error && <p className="text-xs text-fire px-4 pb-2">{error}</p>}
    </div>
  );
}

function MessageItem({
  message,
  replies,
  currentUserId,
  isEditing,
  setEditingId,
  onReply,
  onChanged,
  replyMap,
  setReplyTo,
}: {
  message: Message;
  replies: Message[];
  currentUserId: string;
  isEditing: boolean;
  setEditingId: (id: string | null) => void;
  onReply: () => void;
  onChanged: () => void;
  replyMap: Map<string, Message[]>;
  setReplyTo: (m: Message) => void;
}) {
  const isMine = message.senderId === currentUserId;
  const isStaff = message.sender.role !== "client";

  return (
    <article className="group">
      <MessageBubble
        message={message}
        isMine={isMine}
        isStaff={isStaff}
        currentUserId={currentUserId}
        isEditing={isEditing}
        setEditingId={setEditingId}
        onReply={onReply}
        onChanged={onChanged}
      />

      {/* Replies thread */}
      {replies.length > 0 && (
        <div className="mt-3 ml-11 pl-4 border-l border-ink-800 space-y-3">
          {replies.map((r) => {
            const isReplyMine = r.senderId === currentUserId;
            const isReplyStaff = r.sender.role !== "client";
            return (
              <div key={r._id} className="flex gap-2">
                <CornerDownRight className="h-3 w-3 text-bone-400 flex-shrink-0 mt-2.5" />
                <div className="flex-1 min-w-0">
                  <MessageBubble
                    message={r}
                    isMine={isReplyMine}
                    isStaff={isReplyStaff}
                    currentUserId={currentUserId}
                    isEditing={false}
                    setEditingId={setEditingId}
                    onReply={() => setReplyTo(message)}
                    onChanged={onChanged}
                    compact
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}

function MessageBubble({
  message,
  isMine,
  isStaff,
  currentUserId,
  isEditing,
  setEditingId,
  onReply,
  onChanged,
  compact,
}: {
  message: Message;
  isMine: boolean;
  isStaff: boolean;
  currentUserId: string;
  isEditing: boolean;
  setEditingId: (id: string | null) => void;
  onReply: () => void;
  onChanged: () => void;
  compact?: boolean;
}) {
  const [editBody, setEditBody] = useState(message.body);
  const [busy, setBusy] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  async function react(emoji: string) {
    setShowPicker(false);
    await toggleMessageReaction(message._id, emoji);
    onChanged();
  }

  async function saveEdit() {
    if (!editBody.trim()) return;
    setBusy(true);
    await editMessage(message._id, editBody);
    setBusy(false);
    setEditingId(null);
    onChanged();
  }

  async function remove() {
    if (!confirm("Delete this message?")) return;
    setBusy(true);
    await deleteMessage(message._id);
    setBusy(false);
    setShowMenu(false);
    onChanged();
  }

  return (
    <div className={`flex gap-3 ${isMine ? "justify-end" : ""} ${busy ? "opacity-50" : ""}`}>
      {!isMine && (
        <div
          className={`${compact ? "h-7 w-7 text-[10px]" : "h-8 w-8 text-xs"} rounded-full grid place-items-center font-medium flex-shrink-0 ${
            isStaff ? "bg-fire/20 border border-fire/40 text-fire" : "bg-ink-800 text-bone"
          }`}
        >
          {message.sender.name.slice(0, 1).toUpperCase()}
        </div>
      )}
      <div className={`max-w-[75%] ${isMine ? "items-end" : ""} flex flex-col group/msg relative`}>
        <div className="text-xs text-bone-400 mb-1 px-1 flex items-center gap-2">
          <span>{isMine ? "You" : message.sender.name}</span>
          {!isMine && isStaff && <span className="text-fire">Studio</span>}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              rows={2}
              autoFocus
              className="w-full bg-ink-900 border border-ink-800 px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-fire/40 resize-none"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={saveEdit}
                disabled={busy || !editBody.trim()}
                className="inline-flex items-center gap-1 bg-fire hover:bg-fire-glow text-bone px-3 py-1 rounded-sm text-xs disabled:opacity-50"
              >
                <Check className="h-3 w-3" />
                Save
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="text-xs text-bone-300 hover:text-bone px-2 py-1"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div
              className={`px-4 py-2.5 rounded-sm text-sm leading-relaxed relative ${
                isMine ? "bg-fire text-bone" : "bg-ink-900 border border-ink-800"
              }`}
            >
              <FormattedBody body={message.body} mine={isMine} />

              {/* Hover actions */}
              <div
                className={`absolute ${isMine ? "left-0 -translate-x-full" : "right-0 translate-x-full"} top-0 ${isMine ? "pr-2" : "pl-2"} opacity-0 group-hover/msg:opacity-100 transition-opacity`}
              >
                <div className="flex items-center gap-0.5 bg-ink-950 border border-ink-800 rounded-sm shadow-lg p-0.5">
                  <button
                    onClick={() => setShowPicker((v) => !v)}
                    className="p-1.5 hover:bg-ink-900 rounded-sm text-bone-300 hover:text-fire transition-colors"
                    title="React"
                  >
                    <Smile className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={onReply}
                    className="p-1.5 hover:bg-ink-900 rounded-sm text-bone-300 hover:text-fire transition-colors"
                    title="Reply"
                  >
                    <Reply className="h-3.5 w-3.5" />
                  </button>
                  {isMine && (
                    <button
                      onClick={() => setShowMenu((v) => !v)}
                      className="p-1.5 hover:bg-ink-900 rounded-sm text-bone-300 hover:text-bone transition-colors"
                      title="More"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {showPicker && (
                  <div className={`absolute ${isMine ? "right-full mr-1" : "left-full ml-1"} top-0 bg-ink-950 border border-ink-800 rounded-sm shadow-xl p-1 flex items-center gap-0.5 z-20`}>
                    {QUICK_EMOJI.map((e) => (
                      <button
                        key={e}
                        onClick={() => react(e)}
                        className="h-7 w-7 grid place-items-center hover:bg-ink-900 rounded-sm text-base transition-colors"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                )}

                {showMenu && isMine && (
                  <div className={`absolute ${isMine ? "right-full mr-1" : "left-full ml-1"} top-8 bg-ink-950 border border-ink-800 rounded-sm shadow-xl py-1 min-w-[140px] z-20`}>
                    <button
                      onClick={() => {
                        setEditingId(message._id);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-ink-900 transition-colors"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </button>
                    <button
                      onClick={remove}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-fire hover:bg-fire/10 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Reactions */}
            {message.reactions.length > 0 && (
              <div className={`flex items-center gap-1 mt-1.5 flex-wrap ${isMine ? "justify-end" : ""}`}>
                {message.reactions.map((r) => {
                  const mine = r.users.includes(currentUserId);
                  return (
                    <button
                      key={r.emoji}
                      onClick={() => react(r.emoji)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${
                        mine
                          ? "bg-fire/15 border-fire/60 text-fire"
                          : "bg-ink-900 border-ink-800 text-bone-300 hover:border-bone-300"
                      }`}
                    >
                      <span>{r.emoji}</span>
                      <span className="font-mono text-[10px]">{r.users.length}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <p className={`text-[10px] text-bone-400 mt-1 px-1 ${isMine ? "text-right" : ""}`}>
              {new Date(message.createdAt).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
              {message.editedAt && <span className="ml-1 italic">· edited</span>}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function FormattedBody({ body, mine }: { body: string; mine: boolean }) {
  // Highlight @mentions in the message body
  const parts = body.split(/(@[\p{L}\d_\-\.]+)/gu);
  return (
    <p className="whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (part.startsWith("@") && part.length > 1) {
          return (
            <span
              key={i}
              className={
                mine
                  ? "font-medium underline decoration-bone/50"
                  : "text-fire font-medium"
              }
            >
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}

/* ─────────── Composer with @mention autocomplete ─────────── */

import { forwardRef } from "react";

const Composer = forwardRef<
  HTMLTextAreaElement,
  {
    body: string;
    setBody: (s: string) => void;
    mentions: string[];
    setMentions: (m: string[]) => void;
    projectId: string;
    sending: boolean;
    onSubmit: (e: React.FormEvent) => void;
    replyTo: Message | null;
  }
>(function Composer({ body, setBody, mentions, setMentions, projectId, sending, onSubmit, replyTo }, ref) {
  const [picker, setPicker] = useState<{
    open: boolean;
    q: string;
    members: { _id: string; name: string; role: string }[];
    active: number;
  }>({ open: false, q: "", members: [], active: 0 });

  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = (ref as React.MutableRefObject<HTMLTextAreaElement>) ?? internalRef;

  async function onBodyChange(value: string) {
    setBody(value);
    const ta = textareaRef.current;
    if (!ta) return;
    const caret = ta.selectionStart;
    const before = value.slice(0, caret);
    // Match `@` followed by name fragment up to caret
    const match = before.match(/(?:^|\s)@([\p{L}\d_\-\.]*)$/u);
    if (match) {
      const q = match[1];
      const res = await searchProjectMembers(projectId, q);
      if (res.ok) {
        setPicker({ open: true, q, members: res.members, active: 0 });
        return;
      }
    }
    setPicker((p) => ({ ...p, open: false }));
  }

  function pickMember(m: { _id: string; name: string }) {
    const ta = textareaRef.current;
    if (!ta) return;
    const caret = ta.selectionStart;
    const before = body.slice(0, caret).replace(/(?:^|\s)@([\p{L}\d_\-\.]*)$/u, (full) => {
      // Preserve leading whitespace if present
      const leadSpace = full.startsWith(" ") || full.startsWith("\n");
      return `${leadSpace ? full[0] : ""}@${m.name.replace(/\s+/g, "")} `;
    });
    const after = body.slice(caret);
    setBody(before + after);
    if (!mentions.includes(m._id)) setMentions([...mentions, m._id]);
    setPicker((p) => ({ ...p, open: false }));
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(before.length, before.length);
    }, 0);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (picker.open && picker.members.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setPicker((p) => ({ ...p, active: Math.min(p.active + 1, p.members.length - 1) }));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setPicker((p) => ({ ...p, active: Math.max(p.active - 1, 0) }));
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        pickMember(picker.members[picker.active]);
        return;
      }
      if (e.key === "Escape") {
        setPicker((p) => ({ ...p, open: false }));
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  }

  return (
    <form onSubmit={onSubmit} className="border-t border-ink-800 p-3 flex items-end gap-2 relative">
      {picker.open && picker.members.length > 0 && (
        <div className="absolute bottom-full left-3 right-3 mb-2 bg-ink-950 border border-ink-800 rounded-sm shadow-xl max-h-48 overflow-y-auto z-10">
          <p className="px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-bone-400 border-b border-ink-800 flex items-center gap-1.5">
            <AtSign className="h-3 w-3" /> Mention
          </p>
          <ul>
            {picker.members.map((m, i) => (
              <li key={m._id}>
                <button
                  type="button"
                  onClick={() => pickMember(m)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${
                    picker.active === i ? "bg-ink-900" : "hover:bg-ink-900"
                  }`}
                >
                  <span className={`h-6 w-6 rounded-full grid place-items-center text-[10px] font-medium flex-shrink-0 ${
                    m.role !== "client" ? "bg-fire/20 border border-fire/40 text-fire" : "bg-ink-800 text-bone"
                  }`}>
                    {m.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="flex-1 truncate">{m.name}</span>
                  <span className="text-[10px] uppercase tracking-wider text-bone-400">{m.role === "client" ? "Client" : "Studio"}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => onBodyChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={replyTo ? `Reply to ${replyTo.sender.name}...` : "Write a message... (use @ to mention)"}
        rows={1}
        className="flex-1 bg-ink-900 border border-ink-800 px-4 py-2.5 text-sm rounded-sm focus:outline-none focus:border-fire/40 transition-colors resize-none max-h-32"
      />
      <button
        type="submit"
        disabled={sending || !body.trim()}
        className="h-10 w-10 grid place-items-center bg-fire hover:bg-fire-glow disabled:opacity-50 rounded-sm transition-all flex-shrink-0"
      >
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      </button>
    </form>
  );
});
