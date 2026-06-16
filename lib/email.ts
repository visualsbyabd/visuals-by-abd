import { Resend } from "resend";
import nodemailer from "nodemailer";

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

/**
 * Send an email through whichever transport is configured.
 *
 * Resolution order:
 *   1. RESEND_API_KEY  → Resend
 *   2. SMTP_HOST       → Nodemailer SMTP (Postmark, Sendgrid SMTP, Gmail, etc.)
 *   3. Neither         → console.log (dev mode; never throws)
 *
 * Always returns; failures are logged but never thrown into the caller's
 * request flow so we don't break a sign-up because email is misconfigured.
 */
export async function sendEmail(payload: EmailPayload): Promise<{ ok: boolean; error?: string }> {
  const from = process.env.EMAIL_FROM ?? "Visuals by Abd <hello@visualsbyabd.com>";

  try {
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { error } = await resend.emails.send({
        from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      });
      if (error) throw new Error(error.message);
      return { ok: true };
    }

    if (process.env.SMTP_HOST) {
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT ?? "587", 10),
        secure: process.env.SMTP_SECURE === "true",
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? "" }
          : undefined,
      });
      await transport.sendMail({
        from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      });
      return { ok: true };
    }

    // Dev fallback
    console.log("\n📧 EMAIL (no transport configured — set RESEND_API_KEY or SMTP_HOST in .env)");
    console.log("  To:", payload.to);
    console.log("  Subject:", payload.subject);
    console.log("  Body:", (payload.text ?? payload.html).slice(0, 400));
    console.log("");
    return { ok: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : "Email failed";
    console.error("[email]", error);
    return { ok: false, error };
  }
}

/* ─────────── Templates ─────────── */

export function passwordResetEmail({
  name,
  resetUrl,
}: {
  name?: string;
  resetUrl: string;
}): { html: string; text: string } {
  const text = `Hi${name ? ` ${name}` : ""},

We received a request to reset your password for Visuals by Abd.

Use this link to set a new password (it expires in 1 hour):
${resetUrl}

If you didn't request this, you can safely ignore this email — your password won't change.

— Visuals by Abd`;

  const html = baseEmailLayout({
    preheader: "Reset your Visuals by Abd password",
    body: `
      <p style="margin:0 0 16px;font-size:16px;color:#0A0A0A">Hi${name ? ` ${escapeHtml(name)}` : ""},</p>
      <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.6">
        We received a request to reset your password. Click the button below to set a new one. This link expires in <strong>1 hour</strong>.
      </p>
      ${button(resetUrl, "Set new password")}
      <p style="margin:32px 0 0;font-size:13px;color:#888;line-height:1.6">
        If you didn't request this, you can safely ignore this email — nothing will change.
      </p>
      <p style="margin:24px 0 0;font-size:12px;color:#aaa;word-break:break-all">
        Or paste this URL into your browser:<br/>
        <a href="${resetUrl}" style="color:#D62828">${resetUrl}</a>
      </p>
    `,
  });

  return { html, text };
}

export function magicLinkEmail({
  name,
  signInUrl,
}: {
  name?: string;
  signInUrl: string;
}): { html: string; text: string } {
  const text = `Hi${name ? ` ${name}` : ""},

Here's your one-tap sign-in link for Visuals by Abd. It expires in 15 minutes.

${signInUrl}

If you didn't request this, just ignore the email.

— Visuals by Abd`;

  const html = baseEmailLayout({
    preheader: "Your one-tap sign-in link",
    body: `
      <p style="margin:0 0 16px;font-size:16px;color:#0A0A0A">Hi${name ? ` ${escapeHtml(name)}` : ""},</p>
      <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.6">
        Tap the button to sign in. This link expires in <strong>15 minutes</strong> and only works once.
      </p>
      ${button(signInUrl, "Sign in")}
      <p style="margin:32px 0 0;font-size:13px;color:#888;line-height:1.6">
        Didn't ask for this? You can ignore it safely.
      </p>
    `,
  });

  return { html, text };
}

function button(href: string, label: string): string {
  return `
    <table cellpadding="0" cellspacing="0" border="0">
      <tr><td bgcolor="#D62828" style="border-radius:999px">
        <a href="${href}" style="display:inline-block;padding:14px 32px;font-family:Helvetica,Arial,sans-serif;color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:0.02em">
          ${label}
        </a>
      </td></tr>
    </table>`;
}

/* ─────────── Transactional templates ─────────── */

export function revisionReplyEmail({
  clientName,
  projectTitle,
  revisionTitle,
  replyBody,
  newStatus,
  portalUrl,
}: {
  clientName: string;
  projectTitle: string;
  revisionTitle: string;
  replyBody: string;
  newStatus?: string;
  portalUrl: string;
}): { html: string; text: string; subject: string } {
  const subject = `Studio replied on "${revisionTitle}"`;
  const statusLine = newStatus
    ? `Status was also updated to: ${newStatus.replace(/_/g, " ")}.`
    : "";
  const text = `Hi ${clientName},

The studio replied on your revision request "${revisionTitle}" (project: ${projectTitle}).

— Reply —
${replyBody}

${statusLine}

View the full thread:
${portalUrl}

— Visuals by Abd`;

  const html = baseEmailLayout({
    preheader: `Studio replied on ${revisionTitle}`,
    body: `
      <p style="margin:0 0 8px;font-size:13px;color:#999;text-transform:uppercase;letter-spacing:0.1em">Revision update</p>
      <p style="margin:0 0 8px;font-size:20px;color:#0A0A0A;font-weight:600;line-height:1.3">${escapeHtml(revisionTitle)}</p>
      <p style="margin:0 0 24px;font-size:13px;color:#666">on <strong>${escapeHtml(projectTitle)}</strong></p>

      <p style="margin:0 0 8px;font-size:13px;color:#999;text-transform:uppercase;letter-spacing:0.1em">Studio reply</p>
      <div style="border-left:3px solid #D62828;padding:12px 16px;background:#FAFAFA;margin-bottom:24px">
        <p style="margin:0;font-size:15px;color:#0A0A0A;line-height:1.6;white-space:pre-wrap">${escapeHtml(replyBody)}</p>
      </div>

      ${newStatus ? `<p style="margin:0 0 24px;font-size:14px;color:#444">Status was also updated to <strong>${escapeHtml(newStatus.replace(/_/g, " "))}</strong>.</p>` : ""}

      ${button(portalUrl, "View thread")}
    `,
  });
  return { html, text, subject };
}

export function invoiceIssuedEmail({
  clientName,
  invoiceNumber,
  amount,
  currency,
  dueDate,
  portalUrl,
}: {
  clientName: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  dueDate?: Date;
  portalUrl: string;
}): { html: string; text: string; subject: string } {
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 2,
  }).format(amount);
  const due = dueDate
    ? new Date(dueDate).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })
    : null;
  const subject = `Invoice ${invoiceNumber} — ${formattedAmount}`;
  const text = `Hi ${clientName},

A new invoice has been issued: ${invoiceNumber}

Amount: ${formattedAmount}
${due ? `Due: ${due}` : ""}

View and download from your portal:
${portalUrl}

— Visuals by Abd`;

  const html = baseEmailLayout({
    preheader: `Invoice ${invoiceNumber} for ${formattedAmount}`,
    body: `
      <p style="margin:0 0 8px;font-size:13px;color:#999;text-transform:uppercase;letter-spacing:0.1em">New invoice</p>
      <p style="margin:0 0 4px;font-size:22px;color:#0A0A0A;font-weight:700">${escapeHtml(invoiceNumber)}</p>
      <p style="margin:0 0 28px;font-size:28px;color:#D62828;font-weight:700;letter-spacing:-0.5px">${escapeHtml(formattedAmount)}</p>
      ${due ? `<p style="margin:0 0 24px;font-size:14px;color:#444">Due <strong>${escapeHtml(due)}</strong>.</p>` : ""}
      <p style="margin:0 0 24px;font-size:14px;color:#666;line-height:1.6">
        View the full breakdown and download the PDF from your client portal.
      </p>
      ${button(portalUrl, "View invoice")}
    `,
  });
  return { html, text, subject };
}

export function deliverableAddedEmail({
  clientName,
  projectTitle,
  deliverableTitle,
  deliverableType,
  description,
  dueDate,
  portalUrl,
}: {
  clientName: string;
  projectTitle: string;
  deliverableTitle: string;
  deliverableType: string;
  description?: string;
  dueDate?: Date;
  portalUrl: string;
}): { html: string; text: string; subject: string } {
  const subject = `New on ${projectTitle}: ${deliverableTitle}`;
  const due = dueDate
    ? new Date(dueDate).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })
    : null;
  const text = `Hi ${clientName},

A new item was added to your project "${projectTitle}":

  ${deliverableTitle} (${deliverableType})
${description ? `\n  ${description}` : ""}
${due ? `\n  Due: ${due}` : ""}

View it in your portal:
${portalUrl}

— Visuals by Abd`;

  const html = baseEmailLayout({
    preheader: `New on ${projectTitle}: ${deliverableTitle}`,
    body: `
      <p style="margin:0 0 8px;font-size:13px;color:#999;text-transform:uppercase;letter-spacing:0.1em">New on your project</p>
      <p style="margin:0 0 4px;font-size:13px;color:#666">${escapeHtml(projectTitle)}</p>
      <p style="margin:0 0 24px;font-size:22px;color:#0A0A0A;font-weight:600;line-height:1.3">${escapeHtml(deliverableTitle)}</p>

      <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px">
        <tr>
          <td style="padding:6px 12px;background:#F5F5F5;border-radius:4px;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.08em">
            ${escapeHtml(deliverableType)}
          </td>
          ${due ? `<td style="padding-left:8px;font-size:13px;color:#444">Due <strong>${escapeHtml(due)}</strong></td>` : ""}
        </tr>
      </table>

      ${description ? `<p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.6">${escapeHtml(description)}</p>` : ""}

      ${button(portalUrl, "View in portal")}
    `,
  });
  return { html, text, subject };
}

function baseEmailLayout({ preheader, body }: { preheader: string; body: string }): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Visuals by Abd</title>
</head>
<body style="margin:0;padding:0;background:#FAFAFA;font-family:Helvetica,Arial,sans-serif">
  <span style="display:none;font-size:1px;color:#FAFAFA;line-height:1px">${preheader}</span>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FAFAFA">
    <tr><td align="center" style="padding:48px 16px">
      <table width="560" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF" style="border:1px solid #EEEEEE;border-radius:6px;max-width:560px;width:100%">
        <tr><td style="padding:32px 40px 24px;border-bottom:1px solid #F0F0F0">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="vertical-align:middle">
                <div style="display:inline-block;width:20px;height:20px;background:#D62828;transform:rotate(45deg);vertical-align:middle"></div>
              </td>
              <td style="padding-left:12px;vertical-align:middle">
                <span style="font-size:14px;font-weight:700;letter-spacing:-0.3px;color:#0A0A0A">Visuals by Abd</span>
              </td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:32px 40px">${body}</td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid #F0F0F0;font-size:12px;color:#999;text-align:center">
          Visuals by Abd · Cairo, Egypt
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
