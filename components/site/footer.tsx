import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getSiteSettings } from "@/lib/settings";

export async function Footer() {
  const settings = await getSiteSettings();
  const year = new Date().getFullYear();

  // Build the social links array dynamically from settings — only show what's set
  const socials: { href: string; label: string }[] = [];
  if (settings.instagram) socials.push({ href: settings.instagram, label: "Instagram" });
  if (settings.behance) socials.push({ href: settings.behance, label: "Behance" });
  if (settings.linkedin) socials.push({ href: settings.linkedin, label: "LinkedIn" });
  if (settings.twitter) socials.push({ href: settings.twitter, label: "Twitter" });
  if (settings.youtube) socials.push({ href: settings.youtube, label: "YouTube" });
  if (settings.whatsapp) socials.push({ href: `https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`, label: "WhatsApp" });

  // Brand wordmark — first word from siteName highlighted
  const [firstWord, ...rest] = settings.siteName.split(" ");
  const wordmark = firstWord?.toUpperCase() ?? "VISUALS";

  return (
    <footer className="border-t border-ink-800 mt-32">
      <div className="container py-20">
        <div className="grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-6">
            <p className="eyebrow mb-6">— Let's build something unforgettable</p>
            <h2 className="display-lg text-balance">
              Have a project in&nbsp;mind? <span className="text-fire">Let's talk.</span>
            </h2>
            {settings.email && (
              <Link
                href="/contact"
                className="inline-flex items-center gap-3 mt-10 text-lg font-medium group"
              >
                {settings.email}
                <ArrowUpRight className="h-5 w-5 transition-transform group-hover:rotate-45 text-fire" />
              </Link>
            )}
          </div>

          <div className="lg:col-span-3 lg:col-start-8">
            <p className="eyebrow mb-6">Navigate</p>
            <ul className="space-y-3">
              {[
                { href: "/", label: "Home" },
                { href: "/projects", label: "Projects" },
                { href: "/services", label: "Services" },
                { href: "/about", label: "About" },
                { href: "/contact", label: "Contact" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-fire transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {socials.length > 0 && (
            <div className="lg:col-span-3">
              <p className="eyebrow mb-6">Elsewhere</p>
              <ul className="space-y-3">
                {socials.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:text-fire transition-colors group"
                    >
                      {l.label}
                      <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Giant brand mark — derived from settings */}
        <div className="mt-24 mb-8 overflow-hidden">
          <h3
            className="font-display font-medium leading-none tracking-tightest text-bone select-none"
            style={{ fontSize: "clamp(4rem, 18vw, 18rem)" }}
            aria-hidden="true"
          >
            {wordmark}
            <span className="text-fire">.</span>
          </h3>
        </div>

        <div className="border-t border-ink-800 pt-8 flex flex-col md:flex-row justify-between gap-4 text-sm text-bone-300">
          <p>© {year} {settings.ownerName}. All rights reserved.</p>
          {settings.location && <p>Designed & built with intent in {settings.location.split(",")[0]}.</p>}
        </div>
      </div>
    </footer>
  );
}
