"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  MailOpen,
  StickyNote,
  Trash2,
  AlertCircle,
  Loader2,
  Check,
} from "lucide-react";
import {
  markConversationUnread,
  toggleConversationArchived,
  updateInternalNotes,
  deleteConversation,
} from "@/features/messages/actions";

export function ConversationToolbar({
  projectId,
  archived,
  internalNotes,
  assignedTo,
}: {
  projectId: string;
  archived: boolean;
  internalNotes: string;
  assignedTo: { _id: string; name: string } | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState(internalNotes);
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSavedAt, setNotesSavedAt] = useState<number | null>(null);

  function action(fn: () => Promise<unknown>) {
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  }

  async function saveNotes() {
    setSavingNotes(true);
    await updateInternalNotes(projectId, notes);
    setSavingNotes(false);
    setNotesSavedAt(Date.now());
    setTimeout(() => setNotesSavedAt(null), 2000);
  }

  return (
    <div className="border border-ink-800 rounded-sm">
      <div className="flex items-center gap-1 p-2 flex-wrap">
        <ToolbarButton
          icon={archived ? ArchiveRestore : Archive}
          label={archived ? "Restore" : "Archive"}
          onClick={() => action(() => toggleConversationArchived(projectId, !archived))}
          disabled={pending}
        />
        <ToolbarButton
          icon={MailOpen}
          label="Mark unread"
          onClick={() => action(() => markConversationUnread(projectId))}
          disabled={pending}
        />
        <ToolbarButton
          icon={StickyNote}
          label={`Notes${internalNotes ? " · saved" : ""}`}
          onClick={() => setShowNotes((v) => !v)}
          active={showNotes || !!internalNotes}
        />
        <div className="flex-1" />
        {assignedTo && (
          <p className="text-xs text-bone-400 mr-2">
            Assigned to <span className="text-bone">{assignedTo.name}</span>
          </p>
        )}
        <ToolbarButton
          icon={Trash2}
          label="Delete"
          danger
          disabled={pending}
          onClick={() => {
            if (confirm("Delete this entire conversation? All messages will be removed permanently.")) {
              startTransition(async () => {
                await deleteConversation(projectId);
                router.push("/admin/messages");
                router.refresh();
              });
            }
          }}
        />
      </div>

      {showNotes && (
        <div className="border-t border-ink-800 p-4 bg-ink-950 space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-bone-300 flex items-center gap-2">
            <StickyNote className="h-3 w-3 text-fire" />
            Internal notes
            <span className="text-bone-400 normal-case tracking-normal">— only visible to staff</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Context for the team that the client should never see..."
            className="w-full bg-ink-900 border border-ink-800 px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-fire/40 resize-none"
          />
          <div className="flex items-center justify-end gap-3">
            {notesSavedAt && (
              <span className="text-xs text-fire inline-flex items-center gap-1">
                <Check className="h-3 w-3" />
                Saved
              </span>
            )}
            <button
              onClick={saveNotes}
              disabled={savingNotes || notes === internalNotes}
              className="inline-flex items-center gap-2 bg-fire hover:bg-fire-glow disabled:opacity-50 text-bone px-3 py-1.5 rounded-full text-xs transition-all"
            >
              {savingNotes ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              {savingNotes ? "Saving..." : "Save notes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  active,
  danger,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs transition-colors disabled:opacity-50 ${
        active
          ? "text-fire bg-fire/10"
          : danger
          ? "text-bone-300 hover:text-fire hover:bg-fire/10"
          : "text-bone-300 hover:text-bone hover:bg-ink-900"
      }`}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
      {label}
    </button>
  );
}
