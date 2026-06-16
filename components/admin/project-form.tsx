"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { projectSchema, type ProjectInput } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { slugify } from "@/lib/utils";
import { createProject, updateProject } from "@/features/projects/actions";
import { ImageUploader } from "@/components/admin/image-uploader";
import { ArrowLeft, Save, AlertCircle } from "lucide-react";
import Link from "next/link";

type Props = {
  initial?: Partial<ProjectInput> & { _id?: string };
  mode: "create" | "edit";
};

export function ProjectForm({ initial, mode }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: initial?.title ?? "",
      slug: initial?.slug ?? "",
      description: initial?.description ?? "",
      category: initial?.category ?? "brand-identity",
      type: initial?.type ?? "client",
      coverImage: initial?.coverImage ?? "",
      gallery: initial?.gallery ?? [],
      client: initial?.client ?? "",
      challenge: initial?.challenge ?? "",
      strategy: initial?.strategy ?? "",
      process: initial?.process ?? "",
      deliverables: initial?.deliverables ?? [],
      outcome: initial?.outcome ?? "",
      tags: initial?.tags ?? [],
      featured: initial?.featured ?? false,
      status: initial?.status ?? "draft",
      year: initial?.year ?? new Date().getFullYear(),
      metaTitle: initial?.metaTitle ?? "",
      metaDescription: initial?.metaDescription ?? "",
    },
  });

  const title = watch("title");
  const slug = watch("slug");
  const coverImage = watch("coverImage");
  const gallery = watch("gallery");
  const deliverablesStr = (watch("deliverables") ?? []).join("\n");
  const tagsStr = (watch("tags") ?? []).join(", ");

  function autoSlug() {
    if (title && !slug) setValue("slug", slugify(title));
  }

  async function onSubmit(data: ProjectInput) {
    setError(null);
    const res =
      mode === "create"
        ? await createProject(data)
        : await updateProject(initial!._id!, data);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.push("/admin/projects");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Header */}
      <div className="flex items-end justify-between gap-6 flex-wrap mb-10">
        <div>
          <Link
            href="/admin/projects"
            className="inline-flex items-center gap-2 text-sm text-bone-300 hover:text-fire mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            All projects
          </Link>
          <p className="eyebrow mb-2">— {mode === "create" ? "New" : "Edit"}</p>
          <h1 className="display-md text-balance">
            {mode === "create" ? "Create project" : initial?.title || "Edit project"}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <select
            {...register("status")}
            className="bg-ink-900 border border-ink-800 px-4 py-2.5 text-sm rounded-sm focus:outline-none focus:border-fire/40"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <Button type="submit" disabled={isSubmitting} className="group">
            <Save className="h-4 w-4" />
            {isSubmitting ? "Saving..." : "Save Project"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 border border-fire/40 bg-fire/5 px-4 py-3 text-sm text-fire rounded-sm mb-8">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-8">
          <Section title="Basics">
            <Field label="Title *" error={errors.title?.message}>
              <Input {...register("title")} onBlur={autoSlug} placeholder="The bold project name" />
            </Field>
            <Field label="Slug *" error={errors.slug?.message} hint="URL: /projects/[slug]">
              <Input {...register("slug")} placeholder="auto-generated-from-title" />
            </Field>
            <Field label="Short Description *" error={errors.description?.message}>
              <Textarea
                {...register("description")}
                rows={3}
                placeholder="A one or two sentence elevator pitch for the project."
              />
            </Field>
          </Section>

          <Section title="Cover image">
            <ImageUploader
              folder="projects"
              value={coverImage}
              onChange={(url) => setValue("coverImage", url, { shouldValidate: true })}
            />
            {errors.coverImage && (
              <p className="text-fire text-xs mt-2">{errors.coverImage.message}</p>
            )}
          </Section>

          <Section title="Gallery">
            <div className="rounded-sm border border-fire/30 bg-fire/5 p-4 text-sm">
              <p className="text-bone font-medium mb-1">Gallery moved upstairs.</p>
              <p className="text-bone-300">
                Images and videos are now managed in the{" "}
                <strong className="text-fire">Project media</strong> panel at the top of this page —
                with metadata (title, alt, description), drag reordering, video thumbnails, and a featured-video toggle.
              </p>
              {gallery && gallery.length > 0 && (
                <p className="text-xs text-bone-400 mt-3">
                  This project has {gallery.length} item{gallery.length === 1 ? "" : "s"} in the legacy gallery field.
                  Go to <strong>Admin → run gallery migration</strong> to import them, or they'll render automatically on the public site as a fallback.
                </p>
              )}
            </div>
          </Section>

          <Section title="Case study content">
            <Field label="Client">
              <Input {...register("client")} placeholder="Client or company name" />
            </Field>
            <Field label="Challenge">
              <Textarea {...register("challenge")} rows={4} placeholder="What were we solving?" />
            </Field>
            <Field label="Strategy">
              <Textarea {...register("strategy")} rows={4} placeholder="How did we approach it?" />
            </Field>
            <Field label="Process">
              <Textarea {...register("process")} rows={4} placeholder="The journey from concept to delivery." />
            </Field>
            <Field label="Outcome">
              <Textarea {...register("outcome")} rows={4} placeholder="The result and its impact." />
            </Field>
          </Section>

          <Section title="SEO">
            <Field label="Meta title" hint="Defaults to project title">
              <Input {...register("metaTitle")} placeholder="Optional override" />
            </Field>
            <Field label="Meta description" hint="Defaults to short description">
              <Textarea {...register("metaDescription")} rows={2} placeholder="Optional override" />
            </Field>
          </Section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <SidebarBox title="Classification">
            <Field label="Category *">
              <select
                {...register("category")}
                className="w-full bg-transparent border-0 border-b border-ink-700 h-12 text-base focus:outline-none focus:border-fire"
              >
                <option value="brand-identity">Brand Identity</option>
                <option value="motion-design">Motion Design</option>
                <option value="video-editing">Video Editing</option>
                <option value="graphic-design">Graphic Design</option>
                <option value="web-design">Web Design</option>
                <option value="creative-direction">Creative Direction</option>
              </select>
            </Field>
            <Field label="Type">
              <select
                {...register("type")}
                className="w-full bg-transparent border-0 border-b border-ink-700 h-12 text-base focus:outline-none focus:border-fire"
              >
                <option value="client">Client</option>
                <option value="personal">Personal</option>
              </select>
            </Field>
            <Field label="Year">
              <Input type="number" {...register("year", { valueAsNumber: true })} />
            </Field>
          </SidebarBox>

          <SidebarBox title="Tags & Deliverables">
            <Field label="Tags" hint="Comma-separated">
              <Input
                value={tagsStr}
                onChange={(e) =>
                  setValue(
                    "tags",
                    e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean)
                  )
                }
                placeholder="branding, motion, identity"
              />
            </Field>
            <Field label="Deliverables" hint="One per line">
              <Textarea
                value={deliverablesStr}
                onChange={(e) =>
                  setValue(
                    "deliverables",
                    e.target.value.split("\n").map((t) => t.trim()).filter(Boolean)
                  )
                }
                rows={5}
                placeholder="Logo Design&#10;Visual System&#10;Guidelines"
              />
            </Field>
          </SidebarBox>

          <SidebarBox title="Visibility">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" {...register("featured")} className="peer sr-only" />
              <span className="relative h-5 w-9 rounded-full bg-ink-800 transition-colors peer-checked:bg-fire peer-checked:[&>span]:translate-x-4">
                <span className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-bone transition-transform" />
              </span>
              <span className="text-sm">Featured on homepage</span>
            </label>
          </SidebarBox>
        </div>
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

function SidebarBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-ink-800 rounded-sm">
      <h3 className="px-5 py-3 border-b border-ink-800 text-xs uppercase tracking-[0.2em] text-bone-300 font-medium">
        {title}
      </h3>
      <div className="p-5 space-y-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-bone-400">{hint}</p>}
      {error && <p className="text-xs text-fire">{error}</p>}
    </div>
  );
}
