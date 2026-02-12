export function Footer() {
  return (
    <footer className="border-t border-border px-6 py-12 lg:px-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent">
            <span className="text-[10px] font-bold text-accent-foreground">
              LR
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            Lazi Rewards
          </span>
        </div>

        <nav className="flex items-center gap-6">
          <a
            href="#how-it-works"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            How It Works
          </a>
          <a
            href="#rewards"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Rewards
          </a>
          <a
            href="#faq"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            FAQ
          </a>
        </nav>

        <p className="text-xs text-muted-foreground">
          {new Date().getFullYear()} Lazi Rewards. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
