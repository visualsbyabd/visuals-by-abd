"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { Client } from "@/models/Client";
import { User } from "@/models/User";
import { Project } from "@/models/Project";
import { clientSchema, type ClientInput } from "@/lib/validations";
import { requireStaff } from "@/lib/portal-utils";

export async function createClient(
  data: ClientInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    await requireStaff();
    const parsed = clientSchema.safeParse(data);
    if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

    await connectDB();
    const existing = await Client.findOne({ email: parsed.data.email });
    if (existing) return { ok: false, error: "A client with that email already exists." };

    const client = await Client.create({
      name: parsed.data.name,
      company: parsed.data.company,
      email: parsed.data.email,
      phone: parsed.data.phone,
      avatar: parsed.data.avatar,
      status: parsed.data.status,
      notes: parsed.data.notes,
    });

    // Optionally bootstrap a portal user
    if (parsed.data.createPortalAccount && parsed.data.portalPassword) {
      const userExists = await User.findOne({ email: parsed.data.email });
      if (!userExists) {
        const hash = await bcrypt.hash(parsed.data.portalPassword, 12);
        const user = await User.create({
          email: parsed.data.email,
          password: hash,
          name: parsed.data.name,
          role: "client",
          client: client._id,
        });
        client.user = user._id;
        await client.save();
      }
    }

    revalidatePath("/admin/clients");
    return { ok: true, id: String(client._id) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function updateClient(
  id: string,
  data: Partial<ClientInput>
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireStaff();
    await connectDB();
    await Client.findByIdAndUpdate(id, {
      name: data.name,
      company: data.company,
      email: data.email,
      phone: data.phone,
      avatar: data.avatar,
      status: data.status,
      notes: data.notes,
    });
    revalidatePath("/admin/clients");
    revalidatePath(`/admin/clients/${id}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteClient(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireStaff();
    await connectDB();
    // Detach any projects (don't delete them)
    await Project.updateMany({ clientRef: id }, { $unset: { clientRef: "" }, portalVisible: false });
    // Demote the linked user if any
    const client = await Client.findById(id);
    if (client?.user) {
      await User.findByIdAndDelete(client.user);
    }
    await Client.findByIdAndDelete(id);
    revalidatePath("/admin/clients");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function assignProjectToClient(
  projectId: string,
  clientId: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireStaff();
    await connectDB();
    if (clientId) {
      await Project.findByIdAndUpdate(projectId, {
        clientRef: clientId,
        portalVisible: true,
      });
    } else {
      await Project.findByIdAndUpdate(projectId, {
        $unset: { clientRef: "" },
        portalVisible: false,
      });
    }
    revalidatePath("/admin/projects");
    revalidatePath(`/admin/projects/${projectId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function updateProjectProgress(
  projectId: string,
  progress: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireStaff();
    await connectDB();
    const clamped = Math.max(0, Math.min(100, Math.round(progress)));
    await Project.findByIdAndUpdate(projectId, { progress: clamped });
    revalidatePath(`/admin/projects/${projectId}`);
    revalidatePath("/portal");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}
