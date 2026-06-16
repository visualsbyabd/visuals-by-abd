import type { Metadata } from "next";
import { ContactForm } from "@/components/site/contact-form";
import { Instagram, Linkedin, MessageCircle, Calendar, Mail, Briefcase } from "lucide-react";
import { getSiteSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  return {
    title: "Contact",
    description: `Let's work together. Get in touch with ${s.ownerName} to start a project.`,
  };
}

export default async function ContactPage() {
  const s = await getSiteSettings();

  type Channel = { icon: typeof Mail; label: string; value: string; href: string };
  const channels: Channel[] = [];
  if (s.email) channels.push({ icon: Mail, label: "Email", value: s.email, href: `mailto:${s.email}` });
  if (s.instagram) {
    const handle = s.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/\/$/, "");
    channels.push({ icon: Instagram, label: "Instagram", value: handle ? `@${handle}` : "Instagram", href: s.instagram });
  }
  if (s.linkedin) {
    const handle = s.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, "").replace(/\/$/, "");
    channels.push({ icon: Linkedin, label: "LinkedIn", value: handle || "LinkedIn", href: s.linkedin });
  }
  if (s.behance) {
    const handle = s.behance.replace(/^https?:\/\/(www\.)?behance\.net\//i, "").replace(/\/$/, "");
    channels.push({ icon: Briefcase, label: "Behance", value: handle || "Behance", href: s.behance });
  }
  if (s.whatsapp) {
    const num = s.whatsapp.replace(/\D/g, "");
    channels.push({ icon: MessageCircle, label: "WhatsApp", value: "Direct chat", href: `https://wa.me/${num}` });
  }
  if (s.calendly) {
    channels.push({ icon: Calendar, label: "Calendly", value: "Book a call", href: s.calendly });
  }

  return (
    <div className="pt-32">
      <section className="container py-16 md:py-24">
        <p className="eyebrow mb-6">— Contact</p>
        <h1 className="display-xl text-balance max-w-[16ch]">
          Let's make something <span className="italic font-light text-fire">together</span>.
        </h1>
      </section>

      <section className="container pb-32">
        <div className="grid lg:grid-cols-12 gap-16 lg:gap-24">
          <div className="lg:col-span-7">
            <ContactForm />
          </div>

          <aside className="lg:col-span-5 space-y-12">
            {channels.length > 0 && (
              <div>
                <p className="eyebrow mb-6">— Direct channels</p>
                <ul className="space-y-px">
                  {channels.map(({ icon: Icon, label, value, href }) => (
                    <li key={label}>
                      <a
                        href={href}
                        target={href.startsWith("http") ? "_blank" : undefined}
                        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="group flex items-center gap-5 py-5 border-b border-ink-800 hover:border-fire transition-colors"
                      >
                        <Icon className="h-5 w-5 text-fire" strokeWidth={1.5} />
                        <div className="flex-1">
                          <p className="text-xs uppercase tracking-[0.2em] text-bone-300 mb-0.5">
                            {label}
                          </p>
                          <p className="text-bone group-hover:text-fire transition-colors">{value}</p>
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="border border-ink-800 p-8 rounded-sm">
              <p className="eyebrow mb-4">Response time</p>
              <p className="text-bone leading-relaxed">
                I read every message and respond within <span className="text-fire">24 hours</span>{" "}
                on business days. Currently booking projects starting <span className="text-fire">Q2 2026</span>.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
