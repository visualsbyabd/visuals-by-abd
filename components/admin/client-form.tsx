"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientSchema, type ClientInput } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createClient, updateClient, deleteClient } from "@/features/clients/actions";
import { Save, AlertCircle, Trash2, Loader2 } from "lucide-react";

type Props = {
  initial?: Partial<ClientInput> & { _id?: string; hasPortalAccess?: boolean };
  mode: "create" | "edit";
};

export function ClientForm({ initial, mode }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ClientInput>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: initial?.name ?? "",
      company: initial?.company ?? "",
      email: initial?.email ?? "",
      phone: initial?.phone ?? "",
      status: initial?.status ?? "active",
      notes: initial?.notes ?? "",
      createPortalAccount: false,
      portalPassword: "",
    },
  });

  const createPortal = watch("createPortalAccount");

  async function onSubmit(data: ClientInput) {
    setError(null);
    const res =
      mode === "create"
        ? await createClient(data)
        : await updateClient(initial!._id!, data);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    if (mode === "create" && res.ok && "id" in res) {
      router.push(`/admin/clients/${res.id}`);
    } else {
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <Section title="Contact">
        <div className="grid sm:grid-cols-2 gap-6">
          <Field label="Full name *" error={errors.name?.message}>
            <Input {...register("name")} placeholder="Client's name" />
          </Field>
          <Field label="Company">
            <Input {...register("company")} placeholder="Optional" />
          </Field>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          <Field label="Email *" error={errors.email?.message}>
            <Input type="email" {...register("email")} placeholder="client@company.com" />
          </Field>
          <Field label="Phone">
            <Input {...register("phone")} placeholder="Optional" />
          </Field>
        </div>
      </Section>

      <Section title="Notes">
        <Field label="Internal notes">
          <Textarea rows={4} {...register("notes")} placeholder="Anything to remember about this client..." />
        </Field>
      </Section>

      <Section title="Status">
        <Field label="Status">
          <select
            {...register("status")}
            className="w-full bg-transparent border-0 border-b border-ink-700 h-12 text-base focus:outline-none focus:border-fire"
          >
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </Field>
      </Section>

      {mode === "create" && (
        <Section title="Portal access">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" {...register("createPortalAccount")} className="peer sr-only" />
            <span className="relative h-5 w-9 rounded-full bg-ink-800 peer-checked:bg-fire transition-colors peer-checked:[&>span]:translate-x-4 flex-shrink-0 mt-0.5">
              <span className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-bone transition-transform" />
            </span>
            <span className="text-sm">
              Invite to the client portal
              <span className="block text-xs text-bone-400 mt-0.5">
                Creates a login account at /portal using the email above
              </span>
            </span>
          </label>
          {createPortal && (
            <Field label="Initial password *">
              <Input type="text" {...register("portalPassword")} placeholder="At least 8 characters" />
              {errors.portalPassword && (
                <p className="text-xs text-fire">{errors.portalPassword.message}</p>
              )}
              <p className="text-xs text-bone-400">
                Share this securely with the client — they can change it after first login.
              </p>
            </Field>
          )}
        </Section>
      )}

      {error && (
        <div className="flex items-start gap-3 border border-fire/40 bg-fire/5 px-4 py-3 text-sm text-fire rounded-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        {mode === "edit" && initial?._id ? (
          <button
            type="button"
            disabled={deleting || isSubmitting}
            onClick={async () => {
              const confirmed = window.confirm(
                `Delete "${initial.name}"?\n\nThis will:\n• Permanently remove the client record\n• Detach (not delete) any projects they own\n• Revoke any portal account they had\n\nThis can't be undone.`
              );
              if (!confirmed) return;
              setDeleting(true);
              const res = await deleteClient(initial._id!);
              if (res.ok) {
                router.push("/admin/clients");
                router.refresh();
              } else {
                setDeleting(false);
                setError(res.error);
              }
            }}
            className="inline-flex items-center gap-2 text-sm text-bone-300 hover:text-fire border border-ink-700 hover:border-fire/40 hover:bg-fire/5 px-4 py-2 rounded-sm transition-colors disabled:opacity-50"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {deleting ? "Deleting..." : "Delete client"}
          </button>
        ) : (
          <span />
        )}

        <Button type="submit" disabled={isSubmitting || deleting}>
          <Save className="h-4 w-4" />
          {isSubmitting ? "Saving..." : mode === "create" ? "Create Client" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-ink-800 rounded-sm">
      <h3 className="px-6 py-4 border-b border-ink-800 text-xs uppercase tracking-[0.2em] text-bone-300 font-medium">
        {title}
      </h3>
      <div className="p-6 space-y-6">{children}</div>
    </section>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-fire">{error}</p>}
    </div>
  );
}
