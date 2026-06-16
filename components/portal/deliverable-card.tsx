"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Check, X, FileText, Film, Link2, MessageSquare, Loader2 } from "lucide-react";
import { setDeliverableStatus } from "@/features/clients/deliverables-actions";

type Deliverable = {
  _id: string;
  title: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  type: "image" | "video" | "document" | "link";
  status: "draft" | "in_review" | "approved" | "changes_requested";
  feedback?: string;
  version: number;
  createdAt: string;
};

const statusStyles: Record<string, string> = {
  draft: "border-ink-700 text-bone-300 bg-ink-900",
  in_review: "border-fire/40 text-fire bg-fire/5",
  approved: "border-fire/40 text-fire bg-fire/10",
  changes_requested: "border-fire text-fire bg-fire/10",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  in_review: "Awaiting review",
  approved: "Approved",
  changes_requested: "Changes requested",
};

export function DeliverableCard({
  deliverable,
  isClient,
}: {
  deliverable: Deliverable;
  isClient: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedback, setFeedback] = useState(deliverable.feedback ?? "");
  const [error, setError] = useState<string | null>(null);

  async function act(next: "approved" | "changes_requested", note?: string) {
    setBusy(true);
    setError(null);
    const res = await setDeliverableStatus(deliverable._id, next, note);
    setBusy(false);
    if (res.ok) {
      setFeedbackOpen(false);
      router.refresh();
    } else {
      setError(res.error);
    }
  }

  const canReview = isClient && deliverable.status === "in_review";

  return (
    <article className="border border-ink-800 rounded-sm overflow-hidden flex flex-col">
      {/* Preview */}
      <a
        href={deliverable.url}
        target="_blank"
        rel="noopener noreferrer"
        className="relative aspect-video bg-ink-900 block group"
      >
        {deliverable.type === "image" ? (
          <Image src={deliverable.url} alt={deliverable.title} fill className="object-cover" sizes="400px" />
        ) : deliverable.type === "video" ? (
          deliverable.thumbnailUrl ? (
            <Image src={deliverable.thumbnailUrl} alt={deliverable.title} fill className="object-cover" sizes="400px" />
          ) : (
            <div className="absolute inset-0 grid place-items-center"><Film className="h-10 w-10 text-bone-400" /></div>
          )
        ) : deliverable.type === "link" ? (
          <div className="absolute inset-0 grid place-items-center"><Link2 className="h-10 w-10 text-bone-400" /></div>
        ) : (
          <div className="absolute inset-0 grid place-items-center"><FileText className="h-10 w-10 text-bone-400" /></div>
        )}
        <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/30 transition-colors" />
        <span className="absolute top-3 right-3 text-xs px-2 py-0.5 border rounded-full bg-ink/80 backdrop-blur border-ink-700 text-bone">
          v{deliverable.version}
        </span>
      </a>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-medium leading-tight">{deliverable.title}</h3>
          <span className={`text-[10px] px-2 py-0.5 border rounded-full uppercase tracking-wider flex-shrink-0 ${statusStyles[deliverable.status]}`}>
            {statusLabels[deliverable.status]}
          </span>
        </div>
        {deliverable.description && (
          <p className="text-sm text-bone-300 leading-relaxed mb-3 text-pretty">{deliverable.description}</p>
        )}

        {deliverable.feedback && deliverable.status === "changes_requested" && (
          <div className="text-xs bg-fire/5 border border-fire/40 rounded-sm p-3 mt-2 mb-4">
            <p className="text-fire mb-1 flex items-center gap-1.5">
              <MessageSquare className="h-3 w-3" /> Your feedback:
            </p>
            <p className="text-bone-300">{deliverable.feedback}</p>
          </div>
        )}

        {error && <p className="text-xs text-fire mt-2 mb-1">{error}</p>}

        {/* Actions */}
        <div className="mt-auto pt-4">
          {canReview ? (
            feedbackOpen ? (
              <div className="space-y-3">
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="What needs to change?"
                  rows={3}
                  className="w-full bg-ink-900 border border-ink-800 px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-fire/40 transition-colors resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => act("changes_requested", feedback)}
                    disabled={busy || !feedback.trim()}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-fire hover:bg-fire-glow disabled:opacity-50 text-bone px-4 py-2 text-sm rounded-full transition-all"
                  >
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    Send feedback
                  </button>
                  <button
                    onClick={() => setFeedbackOpen(false)}
                    className="px-4 py-2 text-sm text-bone-300 hover:text-bone"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => act("approved")}
                  disabled={busy}
                  className="inline-flex items-center justify-center gap-1.5 bg-fire hover:bg-fire-glow disabled:opacity-50 text-bone px-4 py-2 text-sm rounded-full transition-all"
                >
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Approve
                </button>
                <button
                  onClick={() => setFeedbackOpen(true)}
                  disabled={busy}
                  className="inline-flex items-center justify-center gap-1.5 border border-ink-700 hover:border-fire hover:text-fire text-bone px-4 py-2 text-sm rounded-full transition-all"
                >
                  <X className="h-3.5 w-3.5" />
                  Request changes
                </button>
              </div>
            )
          ) : (
            <a
              href={deliverable.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 border border-ink-700 hover:border-fire hover:text-fire text-bone-300 px-4 py-2 text-sm rounded-full transition-all w-full"
            >
              Open file
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
