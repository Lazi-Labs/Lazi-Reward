"use client";

import { motion } from "framer-motion";

export function Hero() {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center px-6 pt-20 text-center lg:px-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="flex max-w-3xl flex-col items-center gap-6"
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-full bg-accent" />
          Earn rewards for honest reviews
        </span>

        <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight text-foreground md:text-6xl md:leading-tight">
          Leave a review.
          <br />
          <span className="text-accent">Get a $25 gift card.</span>
        </h1>

        <p className="max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
          We partner with local businesses to reward customers like you. Share
          your honest Google review and choose from hundreds of gift card
          options.
        </p>

        <div className="flex flex-col items-center gap-4 pt-4 sm:flex-row">
          <a
            href="#get-started"
            className="flex h-12 items-center justify-center rounded-full bg-accent px-8 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
          >
            Start Earning
          </a>
          <a
            href="#how-it-works"
            className="flex h-12 items-center justify-center rounded-full border border-border px-8 text-sm font-medium text-foreground transition-colors hover:bg-card"
          >
            See How It Works
          </a>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="mt-20 flex items-center gap-8 text-muted-foreground"
      >
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl font-bold text-foreground">500+</span>
          <span className="text-xs">Reviews Rewarded</span>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl font-bold text-foreground">$25</span>
          <span className="text-xs">Per Review</span>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl font-bold text-foreground">200+</span>
          <span className="text-xs">Gift Card Brands</span>
        </div>
      </motion.div>
    </section>
  );
}
