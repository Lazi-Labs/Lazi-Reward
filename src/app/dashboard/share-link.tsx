"use client";

import { useState } from "react";
import { Check, Copy, Mail, MessageCircle, Share2 } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  link: string;
  rewardAmount: string; // formatted, e.g. "$200"
};

export function ShareLink({ link, rewardAmount }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Older browsers — silently swallow.
    }
  }

  async function nativeShare() {
    if (typeof navigator === "undefined" || !("share" in navigator)) return;
    try {
      await navigator.share({
        title: "Join LAZI Rewards",
        text: `Use my referral link and we both get rewarded.`,
        url: link,
      });
    } catch {
      // User cancelled.
    }
  }

  const subject = encodeURIComponent("Try this — you'll thank me later");
  const body = encodeURIComponent(
    `I've been using these guys for my pool/electrical work and I thought you'd want to check them out. Use my link so we both get a reward: ${link}`,
  );
  const mailto = `mailto:?subject=${subject}&body=${body}`;
  const sms = `sms:?&body=${body}`;
  const fbShare = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          readOnly
          value={link}
          aria-label="Your referral link"
          className="font-mono text-xs"
        />
        <Button onClick={copy} type="button" className="shrink-0">
          {copied ? (
            <>
              <Check className="h-4 w-4" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" /> Copy
            </>
          )}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href={sms}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <MessageCircle className="h-4 w-4" /> Text
        </a>
        <a
          href={mailto}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <Mail className="h-4 w-4" /> Email
        </a>
        <a
          href={fbShare}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <Share2 className="h-4 w-4" /> Facebook
        </a>
        {typeof window !== "undefined" && "share" in navigator ? (
          <Button onClick={nativeShare} variant="outline" size="sm" type="button">
            <Share2 className="h-4 w-4" /> More
          </Button>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        Earn {rewardAmount} when someone you refer books their first job.
      </p>
    </div>
  );
}
