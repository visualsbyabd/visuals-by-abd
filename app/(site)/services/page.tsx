import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { connectDB } from "@/lib/mongodb";
import { Service } from "@/models/Service";
import { getServiceIcon } from "@/lib/service-icons";

export const metadata: Metadata = {
  title: "Services",
  description: "Brand identity, motion design, video editing, graphic design, web design, and creative direction.",
};

export const revalidate = 60;

type ServiceView = {
  title: string;
  slug: string;
  tagline: string;
  description: string;
  icon: string;
  deliverables: string[];
  startingPrice?: string;
};

// Fallback used if the database is empty or unreachable — the original six services.
const FALLBACK: ServiceView[] = [
  {
    title: "Brand Identity",
    slug: "brand-identity",
    icon: "Palette",
    tagline: "Identity systems that build recognition.",
    description:
      "From discovery to delivery: positioning, logo systems, type and color systems, identity guidelines, and brand collateral. Built to scale across motion, print, and digital from day one.",
    deliverables: [
      "Brand strategy and positioning",
      "Logo system and marks",
      "Typography and color systems",
      "Identity guidelines",
      "Stationery and collateral",
      "Launch assets",
    ],
  },
  {
    title: "Video Editing",
    slug: "video-editing",
    icon: "Film",
    tagline: "Cinematic edits that hold attention.",
    description:
      "Promo videos, brand films, social cuts, documentaries, reels. Edited with narrative discipline and graded for premium feel — not just cut, but composed.",
    deliverables: [
      "Promo and brand films",
      "Social reels and shorts",
      "Documentary editing",
      "Color grading",
      "Sound design and mix",
      "Multi-format delivery",
    ],
  },
  {
    title: "Motion Design",
    slug: "motion-design",
    icon: "Sparkles",
    tagline: "Animated identity, in motion.",
    description:
      "Logo reveals, kinetic type, motion identity systems, title sequences, explainers, and broadcast graphics. Motion that's part of the identity, not bolted on after.",
    deliverables: [
      "Logo reveals and stings",
      "Motion identity systems",
      "Kinetic typography",
      "Explainer animations",
      "Title sequences",
      "Broadcast and social graphics",
    ],
  },
  {
    title: "Graphic Design",
    slug: "graphic-design",
    icon: "Layers",
    tagline: "Print and digital, made with intent.",
    description:
      "Editorial, poster, packaging, social, advertising. The traditional disciplines that taught me everything — still where the strongest ideas often live.",
    deliverables: [
      "Editorial design",
      "Posters and prints",
      "Packaging",
      "Social campaigns",
      "Advertising creative",
      "Print collateral",
    ],
  },
  {
    title: "Web Design",
    slug: "web-design",
    icon: "Code2",
    tagline: "Sites that feel as good as they look.",
    description:
      "Portfolio sites, brand sites, landing pages. Designed and built end-to-end with custom code, motion, and the same identity DNA as the rest of the brand.",
    deliverables: [
      "Brand and portfolio sites",
      "Landing pages",
      "Custom Next.js development",
      "Motion and interaction design",
      "CMS integration",
      "Performance and SEO",
    ],
  },
  {
    title: "Creative Direction",
    slug: "creative-direction",
    icon: "Compass",
    tagline: "End-to-end creative leadership.",
    description: "Strategic creative leadership — concept development through final execution.",
    deliverables: ["Strategy", "Art Direction", "Campaign Concepts"],
  },
];

async function getServices(): Promise<ServiceView[]> {
  try {
    await connectDB();
    const services = await Service.find({ active: true })
      .sort({ order: 1, createdAt: 1 })
      .lean();
    if (services.length === 0) return FALLBACK;
    return services.map((s) => ({
      title: s.title,
      slug: s.slug,
      tagline: s.tagline,
      description: s.description,
      icon: s.icon,
      deliverables: s.deliverables,
      startingPrice: s.startingPrice,
    }));
  } catch {
    return FALLBACK;
  }
}

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <div className="pt-32">
      <section className="container py-16 md:py-24">
        <p className="eyebrow mb-6">— Services</p>
        <h1 className="display-xl text-balance max-w-[18ch]">
          Six disciplines, one <span className="italic font-light text-fire">creative practice</span>.
        </h1>
        <p className="mt-12 text-xl text-bone-300 leading-relaxed max-w-3xl text-pretty">
          Engage me for a single discipline or a full brand build. Most projects combine identity,
          motion, and web — that's where the work gets really good.
        </p>
      </section>

      <section className="border-t border-ink-800 mt-12">
        {services.map((service, i) => {
          const Icon = getServiceIcon(service.icon);
          return (
            <div key={service.slug} className="border-b border-ink-800 group">
              <div className="container py-20 md:py-28 grid lg:grid-cols-12 gap-12 items-start">
                <div className="lg:col-span-5 lg:sticky lg:top-32">
                  <div className="flex items-center gap-4 mb-8">
                    <Icon className="h-8 w-8 text-fire" strokeWidth={1.5} />
                    <span className="font-mono text-sm text-bone-400">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h2 className="display-md mb-6 text-balance">{service.title}</h2>
                  <p className="text-xl italic font-light text-bone-300 leading-relaxed">
                    {service.tagline}
                  </p>
                  {service.startingPrice && (
                    <p className="eyebrow mt-8">From {service.startingPrice}</p>
                  )}
                </div>
                <div className="lg:col-span-7">
                  <p className="text-lg text-bone-300 leading-relaxed text-pretty mb-12 whitespace-pre-line">
                    {service.description}
                  </p>
                  {service.deliverables.length > 0 && (
                    <>
                      <p className="eyebrow mb-6">What you get</p>
                      <ul className="grid sm:grid-cols-2 gap-y-4 gap-x-8">
                        {service.deliverables.map((d) => (
                          <li key={d} className="flex items-center gap-3 text-bone">
                            <span className="h-px w-4 bg-fire flex-shrink-0" />
                            {d}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="container py-32 text-center">
        <h2 className="display-lg mb-10 text-balance max-w-[14ch] mx-auto">
          Got a project in <span className="italic font-light text-fire">mind</span>?
        </h2>
        <Link
          href="/contact"
          className="inline-flex items-center gap-3 bg-fire hover:bg-fire-glow text-bone px-10 py-5 rounded-full transition-all shadow-[0_0_60px_-10px_rgba(214,40,40,0.6)] text-lg font-medium group"
        >
          Start a conversation
          <ArrowUpRight className="h-5 w-5 transition-transform group-hover:rotate-45" />
        </Link>
      </section>
    </div>
  );
}
