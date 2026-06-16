"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Calendar as CalendarIcon,
  AlertCircle,
  MessageCircle,
  GripVertical,
  Pencil,
  Trash2,
  X,
  Loader2,
  Send,
} from "lucide-react";
import { createTask, updateTask, moveTask, deleteTask, addTaskComment } from "@/features/tasks/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type TaskComment = {
  _id?: string;
  user: { _id: string; name: string; role: string };
  body: string;
  createdAt: string;
};

export type Task = {
  _id: string;
  title: string;
  description?: string;
  status: "planned" | "in_progress" | "in_review" | "revision" | "approved" | "completed";
  priority: "low" | "medium" | "high";
  dueDate?: string;
  visibleToClient: boolean;
  comments: TaskComment[];
};

const COLUMNS: { id: Task["status"]; label: string }[] = [
  { id: "planned", label: "Planned" },
  { id: "in_progress", label: "In Progress" },
  { id: "in_review", label: "In Review" },
  { id: "revision", label: "Revision" },
  { id: "approved", label: "Approved" },
  { id: "completed", label: "Completed" },
];

const priorityStyles: Record<Task["priority"], string> = {
  low: "text-bone-400 border-ink-700",
  medium: "text-bone-300 border-ink-700",
  high: "text-fire border-fire/40 bg-fire/5",
};

export function KanbanBoard({
  projectId,
  tasks,
  canEdit,
  currentUserId,
}: {
  projectId: string;
  tasks: Task[];
  canEdit: boolean;
  currentUserId: string;
}) {
  const router = useRouter();
  const [openTask, setOpenTask] = useState<Task | null>(null);
  const [newColumn, setNewColumn] = useState<Task["status"] | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [hoverCol, setHoverCol] = useState<Task["status"] | null>(null);

  const byColumn = useMemo(() => {
    const map: Record<Task["status"], Task[]> = {
      planned: [],
      in_progress: [],
      in_review: [],
      revision: [],
      approved: [],
      completed: [],
    };
    for (const t of tasks) map[t.status].push(t);
    return map;
  }, [tasks]);

  async function handleDrop(column: Task["status"]) {
    if (!draggedId) return;
    const task = tasks.find((t) => t._id === draggedId);
    if (!task || task.status === column) {
      setDraggedId(null);
      setHoverCol(null);
      return;
    }
    const newOrder = byColumn[column].length;
    setDraggedId(null);
    setHoverCol(null);
    await moveTask(draggedId, column, newOrder);
    router.refresh();
  }

  return (
    <>
      <div className="overflow-x-auto -mx-6 lg:-mx-10 px-6 lg:px-10">
        <div className="grid grid-cols-6 gap-3 min-w-[1200px]">
          {COLUMNS.map((col) => {
            const items = byColumn[col.id];
            const isHovered = hoverCol === col.id;
            return (
              <div
                key={col.id}
                onDragOver={(e) => {
                  if (canEdit) {
                    e.preventDefault();
                    setHoverCol(col.id);
                  }
                }}
                onDragLeave={() => setHoverCol((prev) => (prev === col.id ? null : prev))}
                onDrop={() => handleDrop(col.id)}
                className={`bg-ink-950 border rounded-sm flex flex-col min-h-[400px] transition-colors ${
                  isHovered ? "border-fire/60 bg-fire/[0.03]" : "border-ink-800"
                }`}
              >
                <header className="px-3 py-3 border-b border-ink-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-[0.18em] text-bone-300 font-medium">
                      {col.label}
                    </span>
                    <span className="text-xs text-bone-400 font-mono">{items.length}</span>
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => setNewColumn(col.id)}
                      className="h-6 w-6 grid place-items-center text-bone-400 hover:text-fire hover:bg-ink-900 rounded-sm transition-colors"
                      title={`Add task to ${col.label}`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  )}
                </header>
                <div className="p-2 flex-1 space-y-2">
                  {items.length === 0 ? (
                    <p className="text-xs text-bone-400 text-center py-6 px-2">
                      {canEdit ? "Drag here or click +" : "Nothing here"}
                    </p>
                  ) : (
                    items.map((task) => (
                      <TaskCard
                        key={task._id}
                        task={task}
                        canEdit={canEdit}
                        onOpen={() => setOpenTask(task)}
                        onDragStart={() => setDraggedId(task._id)}
                        onDragEnd={() => setDraggedId(null)}
                        dragging={draggedId === task._id}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {newColumn !== null && (
        <TaskFormModal
          projectId={projectId}
          initialStatus={newColumn}
          onClose={() => setNewColumn(null)}
          onSaved={() => {
            setNewColumn(null);
            router.refresh();
          }}
        />
      )}

      {openTask && (
        <TaskDetailModal
          task={openTask}
          canEdit={canEdit}
          currentUserId={currentUserId}
          onClose={() => setOpenTask(null)}
          onChanged={() => {
            setOpenTask(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

function TaskCard({
  task,
  canEdit,
  onOpen,
  onDragStart,
  onDragEnd,
  dragging,
}: {
  task: Task;
  canEdit: boolean;
  onOpen: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  dragging: boolean;
}) {
  const overdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completed";

  return (
    <article
      draggable={canEdit}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      className={`bg-ink-900 border border-ink-800 hover:border-fire/40 rounded-sm p-3 cursor-pointer transition-all group ${
        dragging ? "opacity-30" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium leading-tight flex-1">{task.title}</p>
        {canEdit && (
          <GripVertical className="h-3.5 w-3.5 text-bone-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        )}
      </div>
      {task.description && (
        <p className="text-xs text-bone-400 line-clamp-2 mb-3">{task.description}</p>
      )}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className={`text-[10px] px-2 py-0.5 border rounded-full uppercase tracking-wider ${priorityStyles[task.priority]}`}>
          {task.priority}
        </span>
        <div className="flex items-center gap-2 text-xs text-bone-400">
          {task.comments.length > 0 && (
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              {task.comments.length}
            </span>
          )}
          {task.dueDate && (
            <span className={`flex items-center gap-1 ${overdue ? "text-fire" : ""}`}>
              <CalendarIcon className="h-3 w-3" />
              {new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function TaskFormModal({
  projectId,
  initialStatus,
  task,
  onClose,
  onSaved,
}: {
  projectId: string;
  initialStatus?: Task["status"];
  task?: Task;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!task;
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState<Task["status"]>(task?.status ?? initialStatus ?? "planned");
  const [priority, setPriority] = useState<Task["priority"]>(task?.priority ?? "medium");
  const [dueDate, setDueDate] = useState(task?.dueDate ? task.dueDate.slice(0, 10) : "");
  const [visibleToClient, setVisibleToClient] = useState(task?.visibleToClient ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    setSaving(true);
    const payload = {
      project: projectId,
      title,
      description: description || undefined,
      status,
      priority,
      dueDate: dueDate || undefined,
      visibleToClient,
    };
    const res = isEdit ? await updateTask(task!._id, payload) : await createTask(payload);
    setSaving(false);
    if (res.ok) onSaved();
    else setError(res.error);
  }

  return (
    <div className="fixed inset-0 z-[60] bg-ink/80 backdrop-blur flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-ink-950 border border-ink-800 rounded-sm max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-ink-800">
          <h3 className="font-display text-lg">{isEdit ? "Edit" : "New"} task</h3>
          <button onClick={onClose} className="h-9 w-9 grid place-items-center hover:bg-ink-900 rounded-sm">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to happen?" autoFocus />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Column</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Task["status"])}
                className="w-full bg-transparent border-0 border-b border-ink-700 h-12 text-base focus:outline-none focus:border-fire"
              >
                {COLUMNS.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Task["priority"])}
                className="w-full bg-transparent border-0 border-b border-ink-700 h-12 text-base focus:outline-none focus:border-fire"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Due date</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <label className="flex items-center gap-3 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={visibleToClient}
              onChange={(e) => setVisibleToClient(e.target.checked)}
              className="peer sr-only"
            />
            <span className="relative h-5 w-9 rounded-full bg-ink-800 peer-checked:bg-fire transition-colors peer-checked:[&>span]:translate-x-4">
              <span className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-bone transition-transform" />
            </span>
            <span className="text-sm">Visible to client <span className="block text-xs text-bone-400">Internal-only tasks won't appear in the portal</span></span>
          </label>
          {error && (
            <div className="flex items-start gap-2 border border-fire/40 bg-fire/5 px-3 py-2 text-xs text-fire rounded-sm">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 p-5 border-t border-ink-800">
          <button onClick={onClose} className="px-5 py-2.5 text-sm text-bone-300 hover:text-bone">Cancel</button>
          <button
            onClick={save}
            disabled={saving || !title.trim()}
            className="inline-flex items-center gap-2 bg-fire hover:bg-fire-glow disabled:opacity-50 text-bone px-5 py-2.5 rounded-full text-sm font-medium transition-all"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saving ? "Saving..." : isEdit ? "Save" : "Create task"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskDetailModal({
  task,
  canEdit,
  currentUserId,
  onClose,
  onChanged,
}: {
  task: Task;
  canEdit: boolean;
  currentUserId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  async function postComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setSending(true);
    await addTaskComment({ taskId: task._id, body: comment });
    setSending(false);
    setComment("");
    onChanged();
  }

  async function remove() {
    if (!confirm(`Delete task "${task.title}"?`)) return;
    await deleteTask(task._id);
    onChanged();
  }

  if (editing) {
    return (
      <TaskFormModal
        projectId={String((task as unknown as { project?: string }).project ?? "")}
        task={task}
        onClose={() => setEditing(false)}
        onSaved={onChanged}
      />
    );
  }

  const overdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completed";

  return (
    <div className="fixed inset-0 z-[60] bg-ink/80 backdrop-blur flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-ink-950 border border-ink-800 rounded-sm max-w-2xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 p-5 border-b border-ink-800">
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-xl leading-tight">{task.title}</h3>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`text-[10px] px-2 py-0.5 border rounded-full uppercase tracking-wider ${priorityStyles[task.priority]}`}>
                {task.priority} priority
              </span>
              <span className="text-[10px] px-2 py-0.5 border border-ink-700 text-bone-300 rounded-full uppercase tracking-wider">
                {task.status.replace("_", " ")}
              </span>
              {task.dueDate && (
                <span className={`text-xs flex items-center gap-1 ${overdue ? "text-fire" : "text-bone-400"}`}>
                  <CalendarIcon className="h-3 w-3" />
                  Due {new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
              )}
              {canEdit && !task.visibleToClient && (
                <span className="text-[10px] px-2 py-0.5 border border-bone-400 text-bone-300 rounded-full uppercase tracking-wider">
                  Internal
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {canEdit && (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="p-2 hover:bg-ink-900 rounded-sm text-bone-300 hover:text-bone transition-colors"
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={remove}
                  className="p-2 hover:bg-fire/10 rounded-sm text-bone-300 hover:text-fire transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
            <button onClick={onClose} className="h-9 w-9 grid place-items-center hover:bg-ink-900 rounded-sm">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {task.description && (
            <div>
              <p className="eyebrow mb-2">Description</p>
              <p className="text-bone-300 whitespace-pre-wrap leading-relaxed">{task.description}</p>
            </div>
          )}

          <div>
            <p className="eyebrow mb-4">Comments {task.comments.length > 0 && <span className="text-bone-400 normal-case tracking-normal">· {task.comments.length}</span>}</p>
            {task.comments.length === 0 ? (
              <p className="text-sm text-bone-400">No comments yet.</p>
            ) : (
              <ul className="space-y-4">
                {task.comments.map((c, i) => {
                  const isMine = c.user._id === currentUserId;
                  const isStaff = c.user.role !== "client";
                  return (
                    <li key={i} className="flex gap-3">
                      <div className={`h-8 w-8 rounded-full grid place-items-center text-xs font-medium flex-shrink-0 ${
                        isStaff ? "bg-fire/20 border border-fire/40 text-fire" : "bg-ink-800 text-bone"
                      }`}>
                        {c.user.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-bone-400 mb-1">
                          {isMine ? "You" : c.user.name}
                          {!isMine && isStaff && <span className="text-fire ml-2">Studio</span>}
                          <span className="ml-2">
                            {new Date(c.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                          </span>
                        </p>
                        <p className="text-sm text-bone whitespace-pre-wrap">{c.body}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <form onSubmit={postComment} className="border-t border-ink-800 p-3 flex items-end gap-2 flex-shrink-0">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write a comment..."
            rows={1}
            className="flex-1 bg-ink-900 border border-ink-800 px-4 py-2.5 text-sm rounded-sm focus:outline-none focus:border-fire/40 transition-colors resize-none max-h-32"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                postComment(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={sending || !comment.trim()}
            className="h-10 w-10 grid place-items-center bg-fire hover:bg-fire-glow disabled:opacity-50 rounded-sm transition-all flex-shrink-0"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
