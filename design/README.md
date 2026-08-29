# Design link — "PCE Website" Claude Design project

This app's customer-facing screens are built from templates in the
**PCE Website** design project on claude.ai/design:

- Project: `b166afc9-f1a8-4a50-b511-3c56054ad40c`
  (https://claude.ai/design/p/b166afc9-f1a8-4a50-b511-3c56054ad40c)

## What maps to what

| Design file | App implementation |
|---|---|
| `styles.css` (tokens, fonts) | `src/app/globals.css` (`--pce-*` vars + shadcn mapping), `src/app/layout.tsx` (Burbank Big + Sofia Sans) |
| `assets/logo-full.webp` | `public/brand/pce-logo-full.webp` |
| `assets/fonts/BurbankBig-Bold.woff2` | `src/fonts/BurbankBig-Bold.woff2` |
| `templates/review-funnel/ReviewFunnel.dc.html` | `src/app/review/review-funnel.tsx` (+ `/review/[business]`, `/review/[business]/[token]`) |
| `templates/referral/Referral.dc.html` — Refer screen | `src/app/dashboard/refer-hero.tsx` |
| `templates/referral/Referral.dc.html` — Claim/Claimed screens | `src/app/dashboard/reward-claim.tsx` |
| Payout option tiles (both templates) | `src/components/brand/payout-picker.tsx` |
| Card / button kit spec | `src/components/brand/brand-frame.tsx` (`BrandCard`, `NavyCard`, `kitButton`) |

The app pushes preview cards back into the design project under the
**Rewards App** group (`components/rewards-*.html`) so the live implementation
sits next to the source templates. See `design/cards/` for those files.

## Workflow

1. Edit the template in Claude Design.
2. In Claude Code: "sync the review funnel from the PCE Website design project"
   — it reads the `.dc.html` via the DesignSync tool and updates the React port.
3. Re-export the preview cards in `design/cards/` and push with DesignSync
   (`finalize_plan` → `write_files`).

Tokens are duplicated on purpose (CSS vars here, `styles.css` there). If a
color changes in the design project, update the `:root` block in
`src/app/globals.css` to match — the variable names are identical.
