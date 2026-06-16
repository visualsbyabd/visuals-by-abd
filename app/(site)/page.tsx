import { Hero } from "@/components/site/hero";
import { FeaturedWork } from "@/components/site/featured-work";
import { ServicesPreview } from "@/components/site/services-preview";
import { AboutPreview } from "@/components/site/about-preview";
import { Process } from "@/components/site/process";
import { Testimonials } from "@/components/site/testimonials";
import { ContactCTA } from "@/components/site/contact-cta";
import { connectDB } from "@/lib/mongodb";
import { Project } from "@/models/Project";
import { Testimonial } from "@/models/Testimonial";
import { Service } from "@/models/Service";
import { getHomeContent } from "@/lib/home";

export const revalidate = 60;

async function getHomeData() {
  try {
    await connectDB();
    const [projects, testimonials, services] = await Promise.all([
      Project.find({ status: "published", featured: true })
        .sort({ order: 1, createdAt: -1 })
        .limit(4)
        .lean(),
      Testimonial.find({ featured: true }).sort({ order: 1 }).limit(4).lean(),
      Service.find({ active: true })
        .sort({ order: 1, createdAt: 1 })
        .limit(6)
        .lean(),
    ]);
    return {
      projects: projects.map((p) => ({
        _id: String(p._id),
        title: p.title,
        slug: p.slug,
        category: p.category,
        coverImage: p.coverImage,
        year: p.year,
        client: p.client,
      })),
      testimonials: testimonials.map((t) => ({
        _id: String(t._id),
        name: t.name,
        role: t.role,
        company: t.company,
        quote: t.quote,
      })),
      services: services.map((s) => ({
        title: s.title,
        description: s.tagline, // homepage uses tagline as the card description for brevity
        icon: s.icon,
        deliverables: s.deliverables.slice(0, 3),
      })),
    };
  } catch (e) {
    console.error("Failed to load home data:", e);
    return { projects: [], testimonials: [], services: [] };
  }
}

export default async function HomePage() {
  const [{ projects, testimonials, services }, cms] = await Promise.all([
    getHomeData(),
    getHomeContent(),
  ]);

  // When the CMS is disabled (or absent), let each section render its hardcoded defaults
  // by passing `undefined` as `content`. When enabled, project the relevant slice.
  const useCms = cms?.enabled;

  return (
    <>
      <Hero
        content={
          useCms
            ? {
                eyebrow: cms.heroEyebrow,
                headline: cms.heroHeadline,
                description: cms.heroDescription,
                primaryCta: { label: cms.heroPrimaryCtaLabel, href: cms.heroPrimaryCtaHref },
                secondaryCta: cms.heroSecondaryCtaLabel
                  ? { label: cms.heroSecondaryCtaLabel, href: cms.heroSecondaryCtaHref ?? "#" }
                  : undefined,
              }
            : undefined
        }
      />
      <FeaturedWork
        projects={projects}
        content={useCms ? { eyebrow: cms.featuredEyebrow, headline: cms.featuredHeadline } : undefined}
      />
      <ServicesPreview
        services={services}
        content={
          useCms
            ? {
                eyebrow: cms.servicesEyebrow,
                headline: cms.servicesHeadline,
                intro: cms.servicesIntro,
              }
            : undefined
        }
      />
      <AboutPreview
        content={
          useCms
            ? {
                eyebrow: cms.aboutEyebrow,
                headline: cms.aboutHeadline,
                body: cms.aboutBody,
                ctaLabel: cms.aboutCtaLabel,
                ctaHref: cms.aboutCtaHref,
              }
            : undefined
        }
      />
      <Process
        content={
          useCms
            ? {
                eyebrow: cms.processEyebrow,
                headline: cms.processHeadline,
                steps: cms.processSteps,
              }
            : undefined
        }
      />
      <Testimonials
        items={testimonials}
        content={
          useCms
            ? { eyebrow: cms.testimonialsEyebrow, headline: cms.testimonialsHeadline }
            : undefined
        }
      />
      <ContactCTA
        content={
          useCms
            ? {
                eyebrow: cms.ctaEyebrow,
                headline: cms.ctaHeadline,
                description: cms.ctaDescription,
                ctaLabel: cms.ctaLabel,
                ctaHref: cms.ctaHref,
              }
            : undefined
        }
      />
    </>
  );
}
