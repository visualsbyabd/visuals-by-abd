import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ClientForm } from "@/components/admin/client-form";

export default function NewClientPage() {
  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/clients"
        className="inline-flex items-center gap-2 text-sm text-bone-300 hover:text-fire mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        All clients
      </Link>
      <div className="mb-10">
        <p className="eyebrow mb-3">— New</p>
        <h1 className="display-md text-balance">Create client</h1>
        <p className="text-bone-300 mt-2">
          Add a client to your roster. Optionally invite them to the portal in the same step.
        </p>
      </div>
      <ClientForm mode="create" />
    </div>
  );
}
