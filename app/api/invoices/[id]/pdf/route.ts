import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Invoice } from "@/models/Invoice";
import { Setting } from "@/models/Setting";
import { InvoicePdf } from "@/components/invoice-pdf";
import { clientCanAccessProject } from "@/lib/portal-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectDB();

    const invoice = await Invoice.findById(id)
      .populate<{ client: { _id: string; name: string; company?: string; email: string } }>(
        "client",
        "name company email user"
      )
      .lean();
    if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Client access check — they can only download their own
    if (session.user.role === "client") {
      if (!session.user.clientId || String(invoice.client._id) !== session.user.clientId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const settings = await Setting.findOne({ key: "global" }).lean();

    const pdfData = {
      number: invoice.number,
      status: invoice.status,
      issueDate: invoice.issueDate
        ? new Date(invoice.issueDate).toLocaleDateString(undefined, {
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        : "—",
      dueDate: invoice.dueDate
        ? new Date(invoice.dueDate).toLocaleDateString(undefined, {
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        : undefined,
      client: {
        name: invoice.client.name,
        company: invoice.client.company,
        email: invoice.client.email,
      },
      items: invoice.items.map((it: { description: string; quantity: number; unitPrice: number }) => ({
        description: it.description,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
      })),
      currency: invoice.currency,
      subtotal: invoice.subtotal,
      taxRate: invoice.taxRate ?? 0,
      taxAmount: invoice.taxAmount,
      total: invoice.total,
      notes: invoice.notes,
      studio: {
        name: settings?.siteName ?? "Visuals by Abd",
        email: settings?.email ?? "hello@visualsbyabd.com",
        location: settings?.location ?? "Cairo, Egypt",
      },
    };

    const buffer = await renderToBuffer(createElement(InvoicePdf, { data: pdfData }));

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${invoice.number}.pdf"`,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (e) {
    console.error("[invoice-pdf]", e);
    return NextResponse.json({ error: "Failed to render PDF" }, { status: 500 });
  }
}
