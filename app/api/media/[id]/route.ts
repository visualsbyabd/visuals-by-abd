import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Media } from "@/models/Media";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const { id } = await params;
    const media = await Media.findById(id);
    if (!media) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Remove from disk (best-effort)
    try {
      const filepath = path.join(process.cwd(), "public", media.url);
      await unlink(filepath);
    } catch (e) {
      console.warn("Could not remove file from disk:", e);
    }

    await Media.deleteOne({ _id: id });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Delete failed" },
      { status: 500 }
    );
  }
}
