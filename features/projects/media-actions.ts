"use server";

import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import { Project } from "@/models/Project";
import { requireStaff } from "@/lib/portal-utils";

export type MediaInput = {
  type: "image" | "video";
  url: string;
  thumbnail?: string;
  alt?: string;
  title?: string;
  description?: string;
  tags?: string[];
  featured?: boolean;
  duration?: number;
  orientation?: "horizontal" | "vertical";
};

export type MediaUpdate = {
  alt?: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  tags?: string[];
  featured?: boolean;
  duration?: number;
  orientation?: "horizontal" | "vertical";
};

/**
 * Ensures only one media item is marked featured per project.
 * Always run as the last step before saving when featured may have changed.
 */
function enforceSingleFeatured(
  media: Project["media"],
  featuredUrl?: string | null
): Project["media"] {
  if (!featuredUrl) return media;
  return media.map((m) => ({
    ...m,
    featured: m.url === featuredUrl,
  }));
}

export async function addProjectMedia(
  projectId: string,
  items: MediaInput[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireStaff();
    await connectDB();
    const project = await Project.findById(projectId);
    if (!project) return { ok: false, error: "Project not found" };

    const startOrder = project.media?.length ?? 0;
    const newMedia = items.map((it, i) => ({
      type: it.type,
      url: it.url,
      thumbnail: it.thumbnail,
      alt: it.alt,
      title: it.title,
      description: it.description,
      tags: it.tags ?? [],
      featured: false, // only set via explicit toggle to keep exclusivity simple
      duration: it.duration,
      orientation: it.orientation,
      order: startOrder + i,
      uploadedAt: new Date(),
    }));

    project.media = [...(project.media ?? []), ...newMedia];

    // If any new item was uploaded with featured:true, enforce exclusivity
    const featuredItem = items.find((it) => it.featured);
    if (featuredItem) {
      project.media = enforceSingleFeatured(project.media, featuredItem.url);
    }

    await project.save();

    revalidatePath(`/admin/projects/${projectId}`);
    revalidatePath(`/projects/${project.slug}`);
    revalidatePath("/projects");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function updateProjectMedia(
  projectId: string,
  mediaUrl: string,
  data: MediaUpdate
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireStaff();
    await connectDB();
    const project = await Project.findById(projectId);
    if (!project) return { ok: false, error: "Project not found" };

    const item = project.media.find((m) => m.url === mediaUrl);
    if (!item) return { ok: false, error: "Media not found" };

    if (data.alt !== undefined) item.alt = data.alt;
    if (data.title !== undefined) item.title = data.title;
    if (data.description !== undefined) item.description = data.description;
    if (data.thumbnail !== undefined) item.thumbnail = data.thumbnail;
    if (data.tags !== undefined) item.tags = data.tags;
    if (data.duration !== undefined) item.duration = data.duration;
    if (data.orientation !== undefined) item.orientation = data.orientation;
    if (data.featured !== undefined) {
      item.featured = data.featured;
      if (data.featured) {
        // Enforce single-featured
        project.media = enforceSingleFeatured(project.media, mediaUrl);
      }
    }

    await project.save();

    revalidatePath(`/admin/projects/${projectId}`);
    revalidatePath(`/projects/${project.slug}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function removeProjectMedia(
  projectId: string,
  mediaUrl: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireStaff();
    await connectDB();
    const project = await Project.findById(projectId);
    if (!project) return { ok: false, error: "Project not found" };

    project.media = project.media.filter((m) => m.url !== mediaUrl);
    project.media.forEach((m, i) => (m.order = i));
    await project.save();

    revalidatePath(`/admin/projects/${projectId}`);
    revalidatePath(`/projects/${project.slug}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function reorderProjectMedia(
  projectId: string,
  orderedUrls: string[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireStaff();
    await connectDB();
    const project = await Project.findById(projectId);
    if (!project) return { ok: false, error: "Project not found" };

    const map = new Map(project.media.map((m) => [m.url, m]));
    const reordered = orderedUrls
      .map((url, i) => {
        const item = map.get(url);
        if (!item) return null;
        item.order = i;
        return item;
      })
      .filter((m): m is NonNullable<typeof m> => m !== null);

    if (reordered.length !== project.media.length) {
      return { ok: false, error: "Order mismatch" };
    }
    project.media = reordered;
    await project.save();

    revalidatePath(`/admin/projects/${projectId}`);
    revalidatePath(`/projects/${project.slug}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

/**
 * Migrate legacy gallery: string[] → media[] with smart type detection.
 *
 * Detects video file extensions and tags them as type:"video".
 * Idempotent: only acts on projects with non-empty gallery and empty media.
 */
const VIDEO_EXTENSIONS = /\.(mp4|mov|webm|m4v|avi)(\?|#|$)/i;

export async function setProjectMediaLayout(
  projectId: string,
  layout: "mixed" | "videos-grid" | "identities"
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireStaff();
    await connectDB();
    const project = await Project.findById(projectId);
    if (!project) return { ok: false, error: "Project not found" };
    project.mediaLayout = layout;
    await project.save();
    revalidatePath(`/admin/projects/${projectId}`);
    revalidatePath(`/projects/${project.slug}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export type LoadedMedia = {
  type: "image" | "video";
  url: string;
  thumbnail?: string;
  alt?: string;
  title?: string;
  description?: string;
  tags: string[];
  featured: boolean;
  duration?: number;
  orientation?: "horizontal" | "vertical";
  order: number;
};

/**
 * Load a slice of a project's media array — backs the "Load more" button.
 *
 * Uses an aggregation pipeline rather than findById+projection because Mongoose's
 * chained .select() silently overrides the projection passed to findById,
 * which means the $slice operator was being dropped — the full media array was
 * coming over the wire on every "Load more" click. That's what caused the
 * 502/Bad Gateway on large projects.
 *
 * Aggregation pipeline is the canonical, projection-quirk-proof way to do this:
 * - $slice in $project reliably trims the array at the DB layer
 * - $size returns the total count in the same query (one round trip, not two)
 * - The returned `.media` array is guaranteed to contain at most `limit` items
 */
export async function loadMoreProjectMedia(
  projectId: string,
  skip: number,
  limit: number
): Promise<
  | { ok: true; items: LoadedMedia[]; total: number }
  | { ok: false; error: string }
> {
  try {
    if (!Number.isFinite(skip) || skip < 0) return { ok: false, error: "Invalid skip" };
    if (!Number.isFinite(limit) || limit <= 0 || limit > 50) {
      return { ok: false, error: "Invalid limit" };
    }
    if (!mongoose.isValidObjectId(projectId)) {
      return { ok: false, error: "Invalid project id" };
    }
    await connectDB();

    const [result] = await Project.aggregate<{
      _id: mongoose.Types.ObjectId;
      media: Record<string, unknown>[];
      total: number;
    }>([
      { $match: { _id: new mongoose.Types.ObjectId(projectId) } },
      {
        $project: {
          _id: 1,
          media: { $slice: [{ $ifNull: ["$media", []] }, skip, limit] },
          total: { $size: { $ifNull: ["$media", []] } },
        },
      },
    ]);

    if (!result) return { ok: false, error: "Project not found" };

    // Defensive cap. Even if the projection were somehow bypassed by a future
    // edit, we never return more items than the caller requested.
    const items: LoadedMedia[] = (result.media ?? [])
      .slice(0, limit)
      .map((m) => ({
        type: m.type as "image" | "video",
        url: m.url as string,
        thumbnail: m.thumbnail as string | undefined,
        alt: m.alt as string | undefined,
        title: m.title as string | undefined,
        description: m.description as string | undefined,
        tags: (m.tags as string[]) ?? [],
        featured: !!m.featured,
        duration: m.duration as number | undefined,
        orientation: m.orientation as "horizontal" | "vertical" | undefined,
        order: (m.order as number) ?? 0,
      }))
      .sort((a, b) => a.order - b.order);

    return { ok: true, items, total: result.total ?? 0 };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function migrateGalleryToMedia(): Promise<{
  ok: true;
  migrated: number;
} | { ok: false; error: string }> {
  try {
    await requireStaff();
    await connectDB();
    const projects = await Project.find({
      "gallery.0": { $exists: true },
      $or: [{ media: { $size: 0 } }, { media: { $exists: false } }],
    });

    let migrated = 0;
    for (const p of projects) {
      p.media = p.gallery.map((url, i) => ({
        type: VIDEO_EXTENSIONS.test(url) ? ("video" as const) : ("image" as const),
        url,
        tags: [],
        featured: false,
        order: i,
        uploadedAt: new Date(),
      }));
      await p.save();
      migrated++;
    }
    return { ok: true, migrated };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}
