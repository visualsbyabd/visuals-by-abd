import mongoose, { Schema, Document, models } from "mongoose";

export interface IProcessStep {
  number: string;
  title: string;
  description: string;
}

export interface IHomePage extends Document {
  key: string;

  // Hero
  heroEyebrow: string;
  heroHeadline: string;
  heroDescription: string;
  heroPrimaryCtaLabel: string;
  heroPrimaryCtaHref: string;
  heroSecondaryCtaLabel?: string;
  heroSecondaryCtaHref?: string;

  // Featured Work intro
  featuredEyebrow: string;
  featuredHeadline: string;

  // Services intro
  servicesEyebrow: string;
  servicesHeadline: string;
  servicesIntro?: string;

  // About preview
  aboutEyebrow: string;
  aboutHeadline: string;
  aboutBody: string;
  aboutCtaLabel?: string;
  aboutCtaHref?: string;

  // Process
  processEyebrow: string;
  processHeadline: string;
  processSteps: IProcessStep[];

  // Testimonials intro
  testimonialsEyebrow: string;
  testimonialsHeadline: string;

  // Contact CTA
  ctaEyebrow: string;
  ctaHeadline: string;
  ctaDescription?: string;
  ctaLabel: string;
  ctaHref: string;

  // Master toggle — when false, the public homepage uses its hardcoded fallback content.
  enabled: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const ProcessStepSchema = new Schema<IProcessStep>(
  {
    number: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const HomePageSchema = new Schema<IHomePage>(
  {
    key: { type: String, default: "global", unique: true },

    heroEyebrow: { type: String, default: "Abdullah Tharwat — Creative Director, est. Cairo" },
    heroHeadline: { type: String, default: "Visual stories that <em>move</em> people." },
    heroDescription: {
      type: String,
      default:
        "I design brand identities, direct motion, edit film, and build digital experiences for founders and agencies who want craft over template.",
    },
    heroPrimaryCtaLabel: { type: String, default: "See the work" },
    heroPrimaryCtaHref: { type: String, default: "/projects" },
    heroSecondaryCtaLabel: { type: String, default: "Start a project" },
    heroSecondaryCtaHref: { type: String, default: "/contact" },

    featuredEyebrow: { type: String, default: "— Selected Work, 2023—2026" },
    featuredHeadline: { type: String, default: "Work that <em>moves</em>." },

    servicesEyebrow: { type: String, default: "— What I Do" },
    servicesHeadline: { type: String, default: "One studio, every <em>discipline</em>." },
    servicesIntro: {
      type: String,
      default:
        "From brand identity to motion to web — a single creative direction across every surface a brand touches.",
    },

    aboutEyebrow: { type: String, default: "— About" },
    aboutHeadline: { type: String, default: "Brand systems should <em>move</em>." },
    aboutBody: {
      type: String,
      default:
        "I don't believe in still brands anymore. An identity is a living system that has to perform across motion, narrative, screen, and surface — and I built a multidisciplinary practice precisely so the same hand can carry the visual DNA across every touchpoint.",
    },
    aboutCtaLabel: { type: String, default: "Read the full story" },
    aboutCtaHref: { type: String, default: "/about" },

    processEyebrow: { type: String, default: "— Process" },
    processHeadline: { type: String, default: "How we'll <em>work</em>." },
    processSteps: {
      type: [ProcessStepSchema],
      default: [
        { number: "01", title: "Discovery", description: "We talk through what you're building, what's at stake, and what success looks like." },
        { number: "02", title: "Direction", description: "I deliver a clear creative direction: mood, voice, motion principles, and a plan for execution." },
        { number: "03", title: "Craft", description: "Identity, motion, film, web — whatever the brief calls for, made with intent. You see progress weekly." },
        { number: "04", title: "Launch", description: "Everything packaged for handoff: guidelines, source files, exported assets, and a debrief on what's next." },
      ],
    },

    testimonialsEyebrow: { type: String, default: "— Kind Words" },
    testimonialsHeadline: { type: String, default: "What clients <em>say</em>." },

    ctaEyebrow: { type: String, default: "— Let's work" },
    ctaHeadline: { type: String, default: "Have a project in <em>mind</em>?" },
    ctaDescription: {
      type: String,
      default: "I take on a handful of new clients each quarter. Tell me about yours.",
    },
    ctaLabel: { type: String, default: "Start a project" },
    ctaHref: { type: String, default: "/contact" },

    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const HomePage =
  (models.HomePage as mongoose.Model<IHomePage>) ||
  mongoose.model<IHomePage>("HomePage", HomePageSchema);
