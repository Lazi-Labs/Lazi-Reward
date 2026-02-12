"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
  {
    question: "Is this really free?",
    answer:
      "Yes! Our partner businesses fund the gift cards as a way to thank customers for honest feedback. You never pay anything.",
  },
  {
    question: "How long does verification take?",
    answer:
      "Most reviews are verified within minutes using our automated system. In rare cases, manual review may take up to 24 hours.",
  },
  {
    question: "Can I review more than one business?",
    answer:
      "You can leave one review per business you have actually used. Each verified review earns you a $25 gift card.",
  },
  {
    question: "What if my review isn't approved?",
    answer:
      "Reviews must be honest, genuine, and posted on Google to qualify. If there's an issue, we'll reach out via email to help resolve it.",
  },
  {
    question: "How do I receive my gift card?",
    answer:
      "Once verified, you'll receive an email from Tremendous with a link to choose your preferred gift card from 200+ brands.",
  },
];

function FaqItem({
  question,
  answer,
  isOpen,
  onClick,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left"
      aria-expanded={isOpen}
    >
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-6 py-5 transition-colors hover:border-accent/30">
        <span className="pr-4 text-sm font-medium text-foreground">
          {question}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-45" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-2 pt-3 text-sm leading-relaxed text-muted-foreground">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="px-6 py-32 lg:px-12">
      <div className="mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <span className="mb-4 inline-block text-sm font-medium text-accent">
            FAQ
          </span>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Common questions
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col gap-3"
        >
          {faqs.map((faq, index) => (
            <FaqItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onClick={() =>
                setOpenIndex(openIndex === index ? null : index)
              }
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
