---
name: Design Tokens and Conventions
description: Established design token conventions from index.css and observed usage patterns across the IAMS codebase
type: project
---

## Color tokens (index.css @theme)
- brand-900 through brand-100 (navy palette)
- semantic: `text-success` (#059669), `text-danger` (#dc2626), `text-warning` (#d97706), `text-accent` (#f59e0b)
- `bg-success`, `bg-danger`, `bg-warning` are valid Tailwind utilities from these tokens
- Raw Tailwind green/red/amber (`text-green-600`, `text-red-500`) are used alongside semantic tokens — both appear in production code

## Typography conventions
- Headings: `font-display` (DM Serif Display) + `font-bold` or `font-black`
- Section headers: `text-[10px] font-black uppercase tracking-[0.3em] text-gray-400` with a Lucide icon
- Body: DM Sans (font-body, default)
- Mono: JetBrains Mono for IDs

## Card pattern
- Standard card: `bg-white border border-gray-100 rounded-2xl shadow-sm`
- Hero section: `bg-brand-900 text-white rounded-[1.5rem] md:rounded-[2rem]` with `border border-white/5`
- The "Action Center" card in Dashboard.jsx uses `rounded-[1.5rem] md:rounded-[2.5rem]` — slightly larger than the standard hero; this is intentional for the XL content block

## Spacing conventions
- Page bottom padding: `pb-32` is the target for student pages with bottom navbars; `pb-24` and `pb-20` also used (inconsistent)
- Modals: `px-6 pt-5 pb-4` for header, `px-6 py-5` for body, `px-6 py-4` for footer

## Loading state pattern
- Spinner: `<Loader2 className="animate-spin text-brand-500" size={36} />` with `animate-pulse` label text
- Inline loading: `animate-pulse text-brand-600 font-black text-xl tracking-tighter`

**Why:** These conventions are load-bearing for visual parity across the 5 portal roles.
**How to apply:** Flag deviations from these as Minor or Major depending on prominence.
