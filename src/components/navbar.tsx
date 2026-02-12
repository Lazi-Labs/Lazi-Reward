"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function Navbar() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 z-50 flex w-full items-center justify-between border-b border-border bg-background/80 px-6 py-4 backdrop-blur-md lg:px-12"
    >
      <Link href="/" className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
          <span className="text-sm font-bold text-accent-foreground">LR</span>
        </div>
        <span className="text-lg font-semibold text-foreground">
          Lazi Rewards
        </span>
      </Link>

      <nav className="hidden items-center gap-8 md:flex">
        <a
          href="#how-it-works"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          How It Works
        </a>
        <a
          href="#rewards"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Rewards
        </a>
        <a
          href="#faq"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          FAQ
        </a>
      </nav>

      <Link
        href="#get-started"
        className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
      >
        Get Started
      </Link>
    </motion.header>
  );
}
