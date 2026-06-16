/**
 * Seed script — admin + sample portfolio + sample client portal data.
 * Run: npm run seed
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import { User } from "../models/User";
import { Project } from "../models/Project";
import { Testimonial } from "../models/Testimonial";
import { Setting } from "../models/Setting";
import { Client } from "../models/Client";
import { Deliverable } from "../models/Deliverable";
import { Milestone } from "../models/Milestone";
import { Invoice } from "../models/Invoice";
import { Task } from "../models/Task";
import { Activity } from "../models/Activity";
import { Revision } from "../models/Revision";
import { AboutPage } from "../models/AboutPage";
import { HomePage } from "../models/HomePage";
import { Service } from "../models/Service";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("✗ MONGODB_URI is not set in .env / .env.local");
    process.exit(1);
  }

  console.log("→ Connecting to MongoDB...");
  await mongoose.connect(uri);
  console.log("✓ Connected\n");

  // ─────────── Admin user ───────────
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@visualsbyabd.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMeNow_2026!";
  const adminName = process.env.SEED_ADMIN_NAME ?? "Abdullah Tharwat";

  let admin = await User.findOne({ email: adminEmail });
  if (admin) {
    console.log(`✓ Admin user already exists (${adminEmail})`);
  } else {
    const hash = await bcrypt.hash(adminPassword, 12);
    admin = await User.create({
      email: adminEmail,
      password: hash,
      name: adminName,
      role: "admin",
    });
    console.log(`✓ Created admin: ${adminEmail}  (password: ${adminPassword})`);
  }

  // ─────────── Settings ───────────
  await Setting.findOneAndUpdate(
    { key: "global" },
    {
      key: "global",
      siteName: "Visuals by Abd",
      tagline: "Visual Stories That Move People",
      description:
        "Abdullah Tharwat — Creative Director crafting brands, identities, motion, and digital experiences.",
      email: "hello@visualsbyabd.com",
      location: "Cairo, Egypt",
      instagram: "https://instagram.com/visualsbyabd",
      behance: "https://behance.net/visualsbyabd",
      linkedin: "https://linkedin.com/in/abdullah-tharwat",
      defaultMetaTitle: "Visuals by Abd — Abdullah Tharwat · Creative Director",
      defaultMetaDescription:
        "Visual stories that move people. Brand identity, motion design, video editing, web design, and creative direction.",
      ownerName: "Abdullah Tharwat",
      ownerRole: "Creative Director",
      ownerBio:
        "Cairo-based creative director working across brand identity, motion design, video editing, and digital experience.",
    },
    { upsert: true }
  );
  console.log("✓ Settings synced");

  // ─────────── About page content ───────────
  await AboutPage.findOneAndUpdate(
    { key: "global" },
    {
      key: "global",
      enabled: true,
      heroHeadline: "Designer. Editor. Director. <em>Maker.</em>",
      heroSubheadline: "",
      heroDescription:
        "I'm Abdullah Tharwat — a Cairo-based creative director working across brand identity, motion design, video editing, and digital experience. I run Visuals by Abd, a one-person studio for clients who want craft over template.",
      journeyTitle: "How I got <em>here</em>.",
      journeyContent: "",
      journeyMedia: [],
      journeyTimeline: [
        { year: "2018", title: "First commissioned identity", description: "Started taking design seriously. Logos, posters, social. Self-taught, obsessive." },
        { year: "2020", title: "Moved into motion", description: "After Effects, Premiere, Cinema 4D. Brand work began moving — literally." },
        { year: "2022", title: "Visuals by Abd launches", description: "Studio model. Direct client work. Building a body of work with intention." },
        { year: "2024", title: "Multidisciplinary studio", description: "Brand identity, motion, video, web — all under one creative direction." },
        { year: "2026", title: "Now", description: "Working with founders and agencies on premium brand systems and visual stories that ship." },
      ],
      philosophyTitle: "Brand systems should <em>move</em>.",
      philosophyContent:
        "I don't believe in still brands anymore. An identity is no longer a logo file — it's a living system that has to perform in motion, on screen, in narrative, in real-world contexts most designers never test against.\n\nThat's why I built a multidisciplinary practice. The same hand that drew the mark animates the title sequence, edits the launch film, and designs the website. The visual DNA stays intact across every touchpoint — because it has to.",
      experienceTitle: "Numbers <em>that matter</em>.",
      experienceContent:
        "Eight years of practice, a body of work that's grown across more disciplines than most studios commit to.",
      achievements: [
        { value: "8+", label: "Years of practice" },
        { value: "40+", label: "Brand identities shipped" },
        { value: "120+", label: "Motion projects" },
        { value: "12", label: "Industries served" },
      ],
      toolsTitle: "The instruments behind the <em>craft</em>.",
      toolsDescription: "Tools change. The craft doesn't.",
      tools: [
        { category: "Design", name: "Photoshop · Illustrator · InDesign", description: "Adobe Creative Suite — daily drivers" },
        { category: "Motion", name: "After Effects · Cinema 4D · Blender", description: "Motion + 3D for identity systems and launch films" },
        { category: "Product", name: "Figma · Framer · Notion · Linear", description: "Interface design and project planning" },
        { category: "Web", name: "Next.js · React · Tailwind · GSAP", description: "Custom builds, no templates" },
      ],
      visionTitle: "What's <em>next</em>.",
      visionDescription:
        "Studios collapse into platforms. Identities collapse into experiences. I'm building toward work that lives across every surface a brand touches — and tools that make that possible at our scale.",
      visionCtaLabel: "Start a project",
      visionCtaHref: "/contact",
    },
    { upsert: true }
  );
  console.log("✓ About page seeded");

  // ─────────── Home page CMS content ───────────
  await HomePage.findOneAndUpdate(
    { key: "global" },
    {
      key: "global",
      enabled: true,
      heroEyebrow: "Abdullah Tharwat — Creative Director, est. Cairo",
      heroHeadline: "Visual Stories That <em>Move</em> People.",
      heroDescription:
        "I create brands, identities, videos, motion graphics, and digital experiences that leave a lasting impression.",
      heroPrimaryCtaLabel: "View Work",
      heroPrimaryCtaHref: "/projects",
      heroSecondaryCtaLabel: "Let's Work Together",
      heroSecondaryCtaHref: "/contact",
      featuredEyebrow: "— Selected Work, 2023—2026",
      featuredHeadline: "Crafted with <em>obsession</em>.",
      servicesEyebrow: "— What I Do",
      servicesHeadline: "Six disciplines.\n<em>One vision.</em>",
      servicesIntro:
        "Multidisciplinary by design. Every brand, every frame, every pixel — built with the same relentless attention to craft and the same clear point of view.",
      aboutEyebrow: "— About",
      aboutHeadline: "A multidisciplinary creative director shaping brands that <em>resonate</em>.",
      aboutBody:
        "I'm Abdullah Tharwat — a Cairo-based creative director and the studio behind Visuals by Abd. I help founders, agencies, and growing brands turn vision into visual systems people remember.\n\nMy work crosses disciplines on purpose: a brand identity that translates seamlessly into motion; a video edit that carries the same DNA as the print collateral; a website that feels like the natural extension of an identity system.",
      aboutCtaLabel: "Read my story",
      aboutCtaHref: "/about",
      processEyebrow: "— Process",
      processHeadline: "Method behind the <em>magic</em>.",
      processSteps: [
        { number: "01", title: "Discover", description: "Deep listening. Brand audit, audience study, competitive landscape. We define what makes you unmistakable." },
        { number: "02", title: "Define", description: "Strategy, positioning, creative direction. The compass for every decision that follows." },
        { number: "03", title: "Design", description: "Identity systems, motion design, visual storytelling. Concept-driven, craft-obsessed execution." },
        { number: "04", title: "Deliver", description: "Launch-ready assets, brand guidelines, motion libraries. Everything you need to ship and scale." },
      ],
      testimonialsEyebrow: "— Kind Words",
      testimonialsHeadline: "What clients say after we <em>ship</em>.",
      ctaEyebrow: "— Currently booking projects for 2026",
      ctaHeadline: "Ready to make something <em>unforgettable</em>?",
      ctaDescription: "",
      ctaLabel: "Start a project",
      ctaHref: "/contact",
    },
    { upsert: true }
  );
  console.log("✓ Home page seeded");

  // ─────────── Services ───────────
  await Service.deleteMany({});
  await Service.insertMany([
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
      active: true,
      order: 0,
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
      active: true,
      order: 1,
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
      active: true,
      order: 2,
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
      active: true,
      order: 3,
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
      active: true,
      order: 4,
    },
    {
      title: "Creative Direction",
      slug: "creative-direction",
      icon: "Compass",
      tagline: "End-to-end creative leadership.",
      description: "Strategic creative leadership — concept development through final execution.",
      deliverables: ["Strategy", "Art Direction", "Campaign Concepts"],
      active: true,
      order: 5,
    },
  ]);
  console.log("✓ Services seeded");

  // ─────────── Sample Clients (with portal accounts) ───────────
  type ClientSeed = {
    name: string;
    company: string;
    email: string;
    portalPassword: string;
  };
  const clientSeeds: ClientSeed[] = [
    {
      name: "Lina Halabi",
      company: "Aurora Studios",
      email: "lina@aurora-studios.test",
      portalPassword: "AuroraDemo_2026!",
    },
    {
      name: "Marcus Chen",
      company: "Reflex",
      email: "marcus@reflex.test",
      portalPassword: "ReflexDemo_2026!",
    },
  ];

  const createdClients: Record<string, mongoose.Types.ObjectId> = {};

  for (const cs of clientSeeds) {
    let client = await Client.findOne({ email: cs.email });
    let user = await User.findOne({ email: cs.email });

    if (!client) {
      client = await Client.create({
        name: cs.name,
        company: cs.company,
        email: cs.email,
        status: "active",
      });
    }
    if (!user) {
      const hash = await bcrypt.hash(cs.portalPassword, 12);
      user = await User.create({
        email: cs.email,
        password: hash,
        name: cs.name,
        role: "client",
        client: client._id,
      });
      client.user = user._id;
      await client.save();
      console.log(`✓ Created client + portal account: ${cs.email}  (password: ${cs.portalPassword})`);
    } else if (!client.user) {
      client.user = user._id;
      await client.save();
    }
    createdClients[cs.company] = client._id as mongoose.Types.ObjectId;
  }

  // ─────────── Sample projects ───────────
  const sampleProjects = [
    {
      title: "Aurora Studios",
      slug: "aurora-studios",
      description:
        "A complete brand identity and motion system for a boutique film studio.",
      category: "brand-identity" as const,
      type: "client" as const,
      coverImage: "/uploads/projects/.gitkeep",
      gallery: [],
      client: "Aurora Studios",
      clientRef: createdClients["Aurora Studios"],
      portalVisible: true,
      progress: 65,
      challenge:
        "Aurora needed an identity that would work as well in a 6-second pre-roll as it did on letterhead.",
      strategy:
        "Designed a motion-first identity: a monogram that morphs through three states tied to the brand's three production verticals.",
      process:
        "Discovery → moodboards → mark exploration in motion → typography pairing → identity guidelines → motion library → launch assets.",
      outcome:
        "40% increase in inbound leads in the first quarter post-launch.",
      deliverables: ["Logo System", "Motion Identity", "Brand Guidelines", "Stationery", "Launch Film"],
      tags: ["brand identity", "motion", "logo system"],
      year: 2025,
      featured: true,
      status: "published" as const,
      order: 1,
    },
    {
      title: "Reflex — Launch Film",
      slug: "reflex-launch-film",
      description:
        "Directed and edited a 90-second product launch film for a new fitness wearable.",
      category: "video-editing" as const,
      type: "client" as const,
      coverImage: "/uploads/projects/.gitkeep",
      gallery: [],
      client: "Reflex",
      clientRef: createdClients["Reflex"],
      portalVisible: true,
      progress: 40,
      challenge: "Communicate a complex new product clearly in 90 seconds, without losing emotional pull.",
      strategy: "Cinematic edit, dynamic typography, athletic pacing.",
      process: "Pre-production direction → shoot supervision → edit → motion graphics → grade.",
      outcome: "2.3M organic views in launch week.",
      deliverables: ["Direction", "Editing", "Motion Graphics", "Color Grade"],
      tags: ["video", "motion graphics", "launch"],
      year: 2025,
      featured: true,
      status: "published" as const,
      order: 2,
    },
    {
      title: "North Field Coffee",
      slug: "north-field-coffee",
      description:
        "Packaging, identity, and store design for a third-wave coffee roaster.",
      category: "graphic-design" as const,
      type: "client" as const,
      coverImage: "/uploads/projects/.gitkeep",
      gallery: [],
      client: "North Field Coffee Co.",
      challenge: "Distinguish a new specialty coffee brand in a saturated market.",
      strategy: "Pulled away from generic coffee tropes. Topographic maps, agricultural typography, restrained palette.",
      process: "Brand workshop → naming refinement → identity system → packaging design → in-store materials.",
      outcome: "Sold out their first roast in 11 days.",
      deliverables: ["Identity", "Packaging", "Menu System", "Signage"],
      tags: ["packaging", "branding", "print"],
      year: 2025,
      featured: true,
      status: "published" as const,
      order: 3,
    },
    {
      title: "Studio Bilic — Portfolio",
      slug: "studio-bilic-portfolio",
      description:
        "Portfolio site for an architecture studio. Editorial typography meets immersive scroll.",
      category: "web-design" as const,
      type: "client" as const,
      coverImage: "/uploads/projects/.gitkeep",
      gallery: [],
      client: "Studio Bilic",
      challenge: "Translate the studio's restrained architectural language into a digital experience.",
      strategy: "Massive editorial typography, generous whitespace, choreographed scroll states.",
      process: "Discovery → wireframe → design system → animation prototyping → build → CMS integration.",
      outcome: "Awwwards Site of the Day. 3x time-on-page versus the previous site.",
      deliverables: ["Design", "Development", "CMS", "Animation"],
      tags: ["web design", "next.js", "editorial"],
      year: 2024,
      featured: true,
      status: "published" as const,
      order: 4,
    },
  ];

  const projectIdMap: Record<string, mongoose.Types.ObjectId> = {};
  for (const p of sampleProjects) {
    const project = await Project.findOneAndUpdate({ slug: p.slug }, p, { upsert: true, new: true });
    projectIdMap[p.slug] = project._id as mongoose.Types.ObjectId;
  }
  console.log(`✓ Seeded ${sampleProjects.length} projects (2 linked to portal clients)`);

  // ─────────── Sample milestones for the Aurora project ───────────
  const auroraId = projectIdMap["aurora-studios"];
  const reflexId = projectIdMap["reflex-launch-film"];

  await Milestone.deleteMany({ project: { $in: [auroraId, reflexId] } });
  await Milestone.insertMany([
    // Aurora
    { project: auroraId, title: "Discovery & strategy", status: "completed", order: 0, completedAt: new Date(Date.now() - 30 * 86400000) },
    { project: auroraId, title: "Identity exploration", status: "completed", order: 1, completedAt: new Date(Date.now() - 14 * 86400000) },
    { project: auroraId, title: "Motion identity system", status: "in_progress", order: 2, dueDate: new Date(Date.now() + 7 * 86400000) },
    { project: auroraId, title: "Guidelines & launch assets", status: "pending", order: 3, dueDate: new Date(Date.now() + 21 * 86400000) },
    // Reflex
    { project: reflexId, title: "Concept & scripting", status: "completed", order: 0, completedAt: new Date(Date.now() - 10 * 86400000) },
    { project: reflexId, title: "Production direction", status: "in_progress", order: 1, dueDate: new Date(Date.now() + 5 * 86400000) },
    { project: reflexId, title: "Edit & motion pass", status: "pending", order: 2, dueDate: new Date(Date.now() + 20 * 86400000) },
    { project: reflexId, title: "Final delivery", status: "pending", order: 3, dueDate: new Date(Date.now() + 35 * 86400000) },
  ]);
  console.log("✓ Seeded milestones");

  // ─────────── Sample deliverables ───────────
  await Deliverable.deleteMany({ project: { $in: [auroraId, reflexId] } });
  await Deliverable.insertMany([
    {
      project: auroraId,
      title: "Logo Mark — Round 2",
      description: "Three refined directions based on last week's feedback.",
      url: "/uploads/projects/.gitkeep",
      type: "image",
      status: "in_review",
      version: 2,
      uploadedBy: admin._id,
    },
    {
      project: auroraId,
      title: "Color & Typography System",
      description: "Approved direction extended into a full system.",
      url: "/uploads/projects/.gitkeep",
      type: "document",
      status: "approved",
      version: 1,
      uploadedBy: admin._id,
      reviewedAt: new Date(Date.now() - 5 * 86400000),
    },
    {
      project: reflexId,
      title: "Rough Cut — 60s Anthem",
      description: "First narrative pass with placeholder graphics.",
      url: "/uploads/projects/.gitkeep",
      type: "video",
      status: "in_review",
      version: 1,
      uploadedBy: admin._id,
    },
  ]);
  console.log("✓ Seeded deliverables");

  // ─────────── Sample invoices ───────────
  await Invoice.deleteMany({ client: { $in: Object.values(createdClients) } });
  await Invoice.insertMany([
    {
      number: "INV-2026-001",
      client: createdClients["Aurora Studios"],
      project: auroraId,
      items: [
        { description: "Brand strategy & discovery", quantity: 1, unitPrice: 4500 },
        { description: "Identity design", quantity: 1, unitPrice: 8500 },
        { description: "Motion identity system", quantity: 1, unitPrice: 6500 },
      ],
      currency: "USD",
      subtotal: 19500,
      taxRate: 0,
      taxAmount: 0,
      total: 19500,
      status: "paid",
      issueDate: new Date(Date.now() - 45 * 86400000),
      dueDate: new Date(Date.now() - 15 * 86400000),
      paidDate: new Date(Date.now() - 20 * 86400000),
      notes: "Thanks Lina — looking forward to launch week.",
    },
    {
      number: "INV-2026-002",
      client: createdClients["Reflex"],
      project: reflexId,
      items: [
        { description: "Pre-production direction", quantity: 1, unitPrice: 3500 },
        { description: "Edit & post production", quantity: 1, unitPrice: 7500 },
      ],
      currency: "USD",
      subtotal: 11000,
      taxRate: 0,
      taxAmount: 0,
      total: 11000,
      status: "sent",
      issueDate: new Date(Date.now() - 5 * 86400000),
      dueDate: new Date(Date.now() + 25 * 86400000),
      notes: "First milestone invoice — 50% of total scope.",
    },
  ]);
  console.log("✓ Seeded invoices");

  // ─────────── Sample tasks (Kanban) ───────────
  await Task.deleteMany({ project: { $in: [auroraId, reflexId] } });
  await Task.insertMany([
    // Aurora — scattered across columns
    { project: auroraId, title: "Run kickoff call with Lina", status: "completed", priority: "high", order: 0, visibleToClient: true, createdBy: admin._id, completedAt: new Date(Date.now() - 28 * 86400000) },
    { project: auroraId, title: "Compile mood references", status: "completed", priority: "medium", order: 1, visibleToClient: true, createdBy: admin._id, completedAt: new Date(Date.now() - 22 * 86400000) },
    { project: auroraId, title: "Draft three logo directions", status: "approved", priority: "high", order: 0, visibleToClient: true, createdBy: admin._id, dueDate: new Date(Date.now() - 14 * 86400000) },
    { project: auroraId, title: "Refine selected direction", status: "in_review", priority: "high", order: 0, visibleToClient: true, createdBy: admin._id, dueDate: new Date(Date.now() + 3 * 86400000) },
    { project: auroraId, title: "Build motion identity system", status: "in_progress", priority: "high", order: 0, visibleToClient: true, createdBy: admin._id, dueDate: new Date(Date.now() + 10 * 86400000) },
    { project: auroraId, title: "Source typography pairings", status: "in_progress", priority: "medium", order: 1, visibleToClient: false, createdBy: admin._id },
    { project: auroraId, title: "Write brand voice guidelines", status: "planned", priority: "medium", order: 0, visibleToClient: true, createdBy: admin._id, dueDate: new Date(Date.now() + 18 * 86400000) },
    { project: auroraId, title: "Launch film storyboard", status: "planned", priority: "low", order: 1, visibleToClient: true, createdBy: admin._id, dueDate: new Date(Date.now() + 25 * 86400000) },
    // Reflex
    { project: reflexId, title: "Script approval", status: "completed", priority: "high", order: 0, visibleToClient: true, createdBy: admin._id, completedAt: new Date(Date.now() - 9 * 86400000) },
    { project: reflexId, title: "Shoot supervision day", status: "in_progress", priority: "high", order: 0, visibleToClient: true, createdBy: admin._id, dueDate: new Date(Date.now() + 4 * 86400000) },
    { project: reflexId, title: "First rough cut", status: "in_review", priority: "high", order: 0, visibleToClient: true, createdBy: admin._id, dueDate: new Date(Date.now() + 2 * 86400000) },
    { project: reflexId, title: "Motion graphics pass", status: "planned", priority: "medium", order: 0, visibleToClient: true, createdBy: admin._id, dueDate: new Date(Date.now() + 14 * 86400000) },
    { project: reflexId, title: "Color grade & sound", status: "planned", priority: "medium", order: 1, visibleToClient: true, createdBy: admin._id, dueDate: new Date(Date.now() + 22 * 86400000) },
  ]);
  console.log("✓ Seeded tasks");

  // ─────────── Sample activity log ───────────
  await Activity.deleteMany({});
  const auroraClientId = createdClients["Aurora Studios"];
  const reflexClientId = createdClients["Reflex"];
  const linaUser = await User.findOne({ email: "lina@aurora-studios.test" });
  const marcusUser = await User.findOne({ email: "marcus@reflex.test" });

  if (linaUser && marcusUser) {
    await Activity.insertMany([
      {
        type: "project_created",
        actor: admin._id,
        project: auroraId,
        client: auroraClientId,
        title: `Project created: Aurora Studios`,
        link: `/admin/projects/${auroraId}`,
        createdAt: new Date(Date.now() - 35 * 86400000),
      },
      {
        type: "deliverable_uploaded",
        actor: admin._id,
        project: auroraId,
        client: auroraClientId,
        title: `Deliverable uploaded: Color & Typography System`,
        link: `/admin/projects/${auroraId}`,
        createdAt: new Date(Date.now() - 12 * 86400000),
      },
      {
        type: "deliverable_approved",
        actor: linaUser._id,
        project: auroraId,
        client: auroraClientId,
        title: `Approved: Color & Typography System`,
        link: `/admin/projects/${auroraId}`,
        createdAt: new Date(Date.now() - 5 * 86400000),
      },
      {
        type: "milestone_completed",
        actor: admin._id,
        project: auroraId,
        client: auroraClientId,
        title: `Milestone completed: Identity exploration`,
        link: `/admin/projects/${auroraId}`,
        createdAt: new Date(Date.now() - 14 * 86400000),
      },
      {
        type: "task_completed",
        actor: admin._id,
        project: auroraId,
        client: auroraClientId,
        title: `Task completed: Draft three logo directions`,
        link: `/admin/projects/${auroraId}`,
        createdAt: new Date(Date.now() - 14 * 86400000),
      },
      {
        type: "invoice_paid",
        actor: admin._id,
        client: auroraClientId,
        title: `Invoice paid: INV-2026-001`,
        link: `/admin/invoices`,
        createdAt: new Date(Date.now() - 20 * 86400000),
      },
      {
        type: "deliverable_uploaded",
        actor: admin._id,
        project: reflexId,
        client: reflexClientId,
        title: `Deliverable uploaded: Rough Cut — 60s Anthem`,
        link: `/admin/projects/${reflexId}`,
        createdAt: new Date(Date.now() - 2 * 86400000),
      },
      {
        type: "invoice_sent",
        actor: admin._id,
        client: reflexClientId,
        title: `Invoice sent: INV-2026-002`,
        link: `/admin/invoices`,
        createdAt: new Date(Date.now() - 5 * 86400000),
      },
      {
        type: "message_posted",
        actor: marcusUser._id,
        project: reflexId,
        client: reflexClientId,
        title: `Posted a message`,
        description: "Loving the pacing on the rough cut — couple of small notes on the open.",
        link: `/admin/projects/${reflexId}`,
        createdAt: new Date(Date.now() - 1 * 86400000),
      },
    ]);
    console.log("✓ Seeded activity log");
  }

  // ─────────── Sample revisions ───────────
  await Revision.deleteMany({});
  if (linaUser && marcusUser) {
    await Revision.insertMany([
      {
        project: auroraId,
        client: auroraClientId,
        title: "Logo mark feels too sharp at small sizes",
        description: "The corners on the monogram are catching at smaller resolutions (under 32px). Could we soften them just slightly, or build a simplified variant for small uses?",
        priority: "medium",
        status: "working",
        createdBy: linaUser._id,
        attachments: [],
        comments: [
          {
            user: admin._id,
            body: "Good catch. Working on a small-size variant — should have something to look at by Friday.",
            createdAt: new Date(Date.now() - 3 * 86400000),
          },
        ],
        createdAt: new Date(Date.now() - 5 * 86400000),
      },
      {
        project: auroraId,
        client: auroraClientId,
        title: "Motion identity feels rushed in the loop",
        description: "The 4s loop reads great as a one-shot but feels frantic when it cycles. Can we slow the wipe transition by ~20% and add a small breath at the end?",
        priority: "high",
        status: "open",
        createdBy: linaUser._id,
        attachments: [],
        comments: [],
        createdAt: new Date(Date.now() - 1 * 86400000),
      },
      {
        project: reflexId,
        client: reflexClientId,
        title: "Music feels too anthemic over the product reveal",
        description: "The orchestral swell at 0:42 is a bit too earnest for our brand. Can we try something with more restraint — maybe ambient pads + a tighter percussion bed?",
        priority: "medium",
        status: "in_review",
        createdBy: marcusUser._id,
        attachments: [],
        comments: [
          {
            user: admin._id,
            body: "Hearing you — I'll pull three alternate beds together by Monday.",
            createdAt: new Date(Date.now() - 1 * 86400000),
          },
        ],
        createdAt: new Date(Date.now() - 2 * 86400000),
      },
      {
        project: auroraId,
        client: auroraClientId,
        title: "Color palette: dial back the red on light backgrounds",
        description: "The primary red is reading hotter than expected on white. Same hex, but feels different against the warmer paper stock.",
        priority: "low",
        status: "resolved",
        createdBy: linaUser._id,
        attachments: [],
        comments: [
          {
            user: admin._id,
            body: "Tweaked the red to be 4% darker for light-bg use. New swatch in the guidelines doc.",
            createdAt: new Date(Date.now() - 8 * 86400000),
          },
        ],
        resolvedAt: new Date(Date.now() - 8 * 86400000),
        resolvedBy: admin._id,
        createdAt: new Date(Date.now() - 12 * 86400000),
      },
    ]);
    console.log("✓ Seeded revisions");
  }

  // ─────────── Testimonials ───────────
  const testimonials = [
    {
      name: "Lina Halabi",
      role: "Founder",
      company: "Aurora Studios",
      quote:
        "Abdullah didn't just design a brand — he designed a system that thinks in motion. Six months in, every new piece of content feels unmistakably ours.",
      rating: 5,
      featured: true,
      order: 1,
    },
    {
      name: "Marcus Chen",
      role: "Creative Lead",
      company: "Reflex",
      quote:
        "The most disciplined creative I've worked with. Cinematic instincts, ruthless edit, and a level of craft you almost never see on tight timelines.",
      rating: 5,
      featured: true,
      order: 2,
    },
  ];
  for (const t of testimonials) {
    await Testimonial.findOneAndUpdate({ name: t.name, company: t.company }, t, { upsert: true });
  }
  console.log(`✓ Seeded ${testimonials.length} testimonials`);

  await mongoose.disconnect();
  console.log("\n✓ Done.\n");
  console.log("══════════════════════════════════════════════════");
  console.log("ADMIN");
  console.log(`  URL:      http://localhost:3000/login`);
  console.log(`  Email:    ${adminEmail}`);
  console.log(`  Password: ${adminPassword}`);
  console.log("");
  console.log("CLIENT PORTAL — Aurora Studios");
  console.log(`  URL:      http://localhost:3000/login`);
  console.log(`  Email:    ${clientSeeds[0].email}`);
  console.log(`  Password: ${clientSeeds[0].portalPassword}`);
  console.log("");
  console.log("CLIENT PORTAL — Reflex");
  console.log(`  URL:      http://localhost:3000/login`);
  console.log(`  Email:    ${clientSeeds[1].email}`);
  console.log(`  Password: ${clientSeeds[1].portalPassword}`);
  console.log("══════════════════════════════════════════════════\n");
  console.log("Replace placeholder images (.gitkeep) via Admin → Media or Admin → Project.\n");
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
