# Module: TanStack route boundary
# Purpose: Reserve the file-based route directory for the next TanStack Router route migration
# Used by: Vite/TanStack frontend foundation
# Dependencies: @tanstack/react-router
# Public functions: None
# Side effects: None
<!--
  Module: TanStack source map
  Purpose: Document the frontend module boundaries after route refactor
  Used by: Developers maintaining the project
  Dependencies: src/router.tsx, src/pages, src/components, src/lib
  Public functions: None
  Side effects: Documentation only
-->
# Frontend structure

- `router.tsx` — route registry, providers, and application mount only.
- `components/` — shared shell and reusable cards.
- `pages/` — one module per public page or related route pair.
- `lib/` — Supabase clients and domain data services.
- `admin.tsx` — authenticated owner login mounted by `/auth/login`; the owner workspace lives under `/dashboard`.
