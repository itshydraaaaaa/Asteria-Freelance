UI updates applied for Dashboard

Changes:
- Added Apple/system font stack variables in `app/globals.css` for `--font-heading`, `--font-body`, and `--font-mono`.
- Updated `tailwind.config.ts` to use CSS font variables and added a small typography scale.
- Added micro-interaction utilities (`card-hover`, `btn-ghost`, `focus-ring-primary`) in `app/globals.css`.
- Added framer-motion micro variants in `lib/motion.ts` (`microHover`, `popIn`).
- Applied micro interactions to `DashboardStats`, `DashboardChart`, and `DashboardNav`.

How to test locally

1. Install dependencies (if not installed):

```bash
npm install
```

2. Run the dev server:

```bash
npm run dev
```

3. Open the dashboard at `http://localhost:5000/dashboard` and verify:
- Fonts use the Apple/system stack on macOS/iOS devices.
- Hovering cards and nav items shows subtle lift and shadow.
- Counters animate when metrics mount.

Notes & next steps

- We can further polish timing and easing for specific components.
- Consider adding a lightweight utility to lazy-load non-critical fonts or swap in custom fonts for brand alignment.
