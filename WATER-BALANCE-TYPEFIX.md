# v21 Water Balance Type Fix

Fixed Vercel TypeScript error in `app/page.tsx` where built-in BreadStyle `extras` items lacked the `id` property required by the water-profile engine.

Changes:
- `BreadStyle.extras` now uses `CustomInclusion[]`.
- Built-in extra items now have stable ids and categories.
- Added water profiles for Rye Scald, butter, egg, sugar/honey, and sugar/malt.

This keeps the Water Balance feature strongly typed and compatible with Vercel build/type-checking.
