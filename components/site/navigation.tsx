"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthNavButton } from "@/components/site/auth-nav-button";

const links = [
  { href: "/", label: "Work" },
  { href: "/projects", label: "Projects" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Navigation({ siteName = "Visuals by Abd" }: { siteName?: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          scrolled
            ? "bg-ink/80 backdrop-blur-xl border-b border-ink-800"
            : "bg-transparent border-b border-transparent"
        )}
      >
        <nav className="container flex h-20 items-center justify-between">
          <Link href="/" className="group flex items-center gap-3" aria-label={`${siteName} home`}>
            <div className="relative h-9 w-9 grid place-items-center">
              <span className="absolute inset-0 bg-fire rounded-sm rotate-45 group-hover:rotate-[225deg] transition-transform duration-700" />
              <span className="relative font-display font-bold text-bone text-sm z-10">{siteName.slice(0, 1).toUpperCase()}</span>
            </div>
            <span className="hidden sm:block font-display font-medium tracking-tight">
              {siteName}
            </span>
          </Link>

          <ul className="hidden md:flex items-center gap-8">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "text-sm font-medium tracking-wide transition-colors relative py-2",
                      active ? "text-bone" : "text-bone-300 hover:text-bone"
                    )}
                  >
                    {link.label}
                    {active && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute -bottom-px left-0 right-0 h-px bg-fire"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          <AuthNavButton variant="desktop" />

          <button
            className="md:hidden text-bone"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-ink md:hidden"
          >
            <div className="container flex h-20 items-center justify-between">
              <span className="font-display font-medium">Menu</span>
              <button onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="h-6 w-6" />
              </button>
            </div>
            <ul className="container space-y-2 pt-12">
              {links.map((link, i) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                >
                  <Link
                    href={link.href}
                    className="block py-3 font-display text-4xl tracking-tight hover:text-fire transition-colors"
                  >
                    {link.label}
                  </Link>
                </motion.li>
              ))}
              <motion.li
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + links.length * 0.05 }}
                className="pt-8"
              >
                <AuthNavButton variant="mobile" />
              </motion.li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
