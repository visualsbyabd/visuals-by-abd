import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import sharp from "sharp";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Media } from "@/models/Media";

const ALLOWED_FOLDERS = ["projects", "videos", "identities", "web-designs", "profile", "testimonials", "brands"];
const MAX_SIZE = 100 * 1024 * 1024; // 100 MB

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

function getFileType(mime: string): "image" | "video" | "document" {
  if (IMAGE_TYPES.has(mime)) return "image";
  if (VIDEO_TYPES.has(mime)) return "video";
  return "document";
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "projects";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_FOLDERS.includes(folder)) {
      return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 100MB)" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Make a unique filename
    const ext = path.extname(file.name).toLowerCase() || ".bin";
    const hash = randomBytes(8).toString("hex");
    const safeName = path
      .basename(file.name, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "file";
    const filename = `${safeName}-${hash}${ext}`;

    // Ensure folder exists
    const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
    await mkdir(uploadDir, { recursive: true });

    const fileType = getFileType(file.type);
    let width: number | undefined;
    let height: number | undefined;
    let finalBuffer = buffer;

    // Optimize images via sharp
    if (fileType === "image" && file.type !== "image/gif") {
      try {
        const optimized = sharp(buffer);
        const meta = await optimized.metadata();
        width = meta.width;
        height = meta.height;

        // Re-encode efficiently while keeping format
        if (file.type === "image/png") {
          finalBuffer = await optimized.png({ quality: 90 }).toBuffer();
        } else {
          finalBuffer = await optimized.jpeg({ quality: 88, mozjpeg: true }).toBuffer();
        }
      } catch (e) {
        console.warn("Sharp optimization failed, using original:", e);
      }
    }

    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, finalBuffer);

    const publicUrl = `/uploads/${folder}/${filename}`;

    // Track in DB
    await connectDB();
    const media = await Media.create({
      filename,
      originalName: file.name,
      url: publicUrl,
      type: fileType,
      mimeType: file.type,
      size: finalBuffer.length,
      folder,
      width,
      height,
      uploadedBy: session.user.id,
    });

    return NextResponse.json({
      url: publicUrl,
      id: String(media._id),
      type: fileType,
      mimeType: file.type,
      width,
      height,
      size: finalBuffer.length,
    });
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 500 }
    );
  }
}
