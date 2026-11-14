# HikaruStore UI handover integration

Design reference: `hikarustore-ui-handover.zip`, packaged 13 November 2026.

The existing application routes and data stores remain the source of live data. The canvas HTML is used as a visual reference, not executed or embedded as an application. Placeholder orders, customers, bank accounts and totals from the handover are not imported.

## Applied

- A compiled Astryx `hikaru` theme owns the charcoal surfaces, gold primary action, green success, red error, borders and radii. Rebuild with `pnpm exec astryx theme build src/themes/hikaru/hikaruTheme.ts` after editing the theme source.
- Be Vietnam Pro is loaded through Next.js and used throughout the app. Dark is the initial appearance; explicit saved light/system preferences continue to work.
- Existing guest, authentication, POS, dashboard, partner and dialog components use semantic theme utilities instead of the previous mixed green, gray and gold palettes. Legacy global color overrides were removed.
- Admin retains four navigation groups, collapsible desktop navigation, tablet drawer and mobile bottom navigation. Main content now aligns with the sidebar width and has one shared padding budget.
- The guest catalog includes the three reservation steps, a two-column phone product grid and neutral product prices. Shared buttons and inputs have larger touch targets.
- The supplied logo and PWA appearance are applied; the service-worker cache version is advanced to refresh installed clients.

## Existing behavior retained

Reservation expiry, proof requirements, order numbering, role management, cancellation and refund rules are unchanged. The handover marks some of these as proposals or unresolved decisions. Existing routes and modal workflows are retained rather than introducing disconnected canvas-only screens. The light palette is an application fallback because the handover contains only dark designs.

## Validation

Run `pnpm exec tsc --noEmit`, `pnpm build`, and `pnpm exec astryx doctor --built .`.
Validation on 14 November 2026: TypeScript and production build passed (49 generated pages). Astryx doctor passed with zero failures; it warns about existing raw component usage and cannot recognize the Next.js-managed font stylesheet. Browser checks covered login, admin, guest preview and POS, including 390 × 844 layouts without horizontal overflow. No orders were submitted.

ESLint reports 20 errors in `src`, matching the 20 errors reproduced against the original `HEAD` source. These existing issues include explicit `any`, synchronous state updates in effects and a legacy `require`. They remain outside this visual migration.
