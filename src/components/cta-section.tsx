"use client";

import { motion } from "framer-motion";

export function CtaSection() {
  return (
    <section id="get-started" className="px-6 py-32 lg:px-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-3xl rounded-3xl border border-border bg-card p-12 text-center md:p-16"
      >
        <span className="mb-4 inline-block text-sm font-medium text-accent">
          Ready to get rewarded?
        </span>
        <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Your $25 gift card is waiting
        </h2>
        <p className="mx-auto mt-4 max-w-md text-pretty text-muted-foreground">
          It only takes a few minutes. Pick a business, share your experience,
          and choose your reward.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="#"
            className="flex h-12 items-center justify-center rounded-full bg-accent px-8 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
          >
            Get Started Now
          </a>
          <a
            href="#how-it-works"
            className="flex h-12 items-center justify-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Learn more
            <svg
              className="ml-1 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
              />
            </svg>
          </a>
        </div>
      </motion.div>
    </section>
  );
}
