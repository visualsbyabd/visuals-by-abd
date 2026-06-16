"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save, Check } from "lucide-react";
import { updateSettings } from "@/features/auth/settings-actions";

type Settings = {
  siteName: string;
  tagline: string;
  description: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  location?: string;
  instagram?: string;
  behance?: string;
  linkedin?: string;
  twitter?: string;
  youtube?: string;
  calendly?: string;
  defaultMetaTitle: string;
  defaultMetaDescription: string;
  ownerName: string;
  ownerRole: string;
  ownerBio?: string;
};

export function SettingsForm({ initial }: { initial: Settings }) {
  const [data, setData] = useState<Settings>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setData((d) => ({ ...d, [key]: value }));
    setSaved(false);
  }

  async function save() {
    setError(null);
    setSaving(true);
    const res = await updateSettings(data);
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } else {
      setError(res.error);
    }
  }

  return (
    <div className="space-y-8">
      <Section title="Identity">
        <div className="grid sm:grid-cols-2 gap-6">
          <Field label="Site name">
            <Input value={data.siteName} onChange={(e) => set("siteName", e.target.value)} />
          </Field>
          <Field label="Tagline">
            <Input value={data.tagline} onChange={(e) => set("tagline", e.target.value)} />
          </Field>
        </div>
        <Field label="Description">
          <Textarea
            rows={3}
            value={data.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </Field>
      </Section>

      <Section title="Owner">
        <div className="grid sm:grid-cols-2 gap-6">
          <Field label="Name">
            <Input value={data.ownerName} onChange={(e) => set("ownerName", e.target.value)} />
          </Field>
          <Field label="Role">
            <Input value={data.ownerRole} onChange={(e) => set("ownerRole", e.target.value)} />
          </Field>
        </div>
        <Field label="Bio">
          <Textarea
            rows={4}
            value={data.ownerBio ?? ""}
            onChange={(e) => set("ownerBio", e.target.value)}
          />
        </Field>
      </Section>

      <Section title="Contact">
        <div className="grid sm:grid-cols-2 gap-6">
          <Field label="Email">
            <Input value={data.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label="Phone">
            <Input value={data.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field label="WhatsApp link">
            <Input value={data.whatsapp ?? ""} onChange={(e) => set("whatsapp", e.target.value)} placeholder="https://wa.me/..." />
          </Field>
          <Field label="Location">
            <Input value={data.location ?? ""} onChange={(e) => set("location", e.target.value)} placeholder="Cairo, Egypt" />
          </Field>
        </div>
      </Section>

      <Section title="Social channels">
        <div className="grid sm:grid-cols-2 gap-6">
          {(["instagram", "behance", "linkedin", "twitter", "youtube", "calendly"] as const).map((k) => (
            <Field key={k} label={k.charAt(0).toUpperCase() + k.slice(1)}>
              <Input value={data[k] ?? ""} onChange={(e) => set(k, e.target.value)} placeholder="https://..." />
            </Field>
          ))}
        </div>
      </Section>

      <Section title="SEO defaults">
        <Field label="Default meta title">
          <Input
            value={data.defaultMetaTitle}
            onChange={(e) => set("defaultMetaTitle", e.target.value)}
          />
        </Field>
        <Field label="Default meta description">
          <Textarea
            rows={2}
            value={data.defaultMetaDescription}
            onChange={(e) => set("defaultMetaDescription", e.target.value)}
          />
        </Field>
      </Section>

      <div className="sticky bottom-0 -mx-6 lg:-mx-10 px-6 lg:px-10 py-4 bg-ink/80 backdrop-blur border-t border-ink-800 flex items-center justify-end gap-4">
        {error && <span className="text-sm text-fire">{error}</span>}
        {saved && (
          <span className="text-sm text-fire flex items-center gap-2">
            <Check className="h-4 w-4" /> Saved
          </span>
        )}
        <Button onClick={save} disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
