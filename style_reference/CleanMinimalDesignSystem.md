# DVT Clean Minimal Design System

## Purpose
This document defines the current UI source of truth for DVT.

It is repo-specific and applies to:
- `src/shared/theme.ts`
- `src/shared/ui/primitives`
- `src/pages/UIKitPage`
- `style_reference/CleanMinimalComponents.tsx`

## Source Of Truth
Use this order:
1. `src/shared/theme.ts`
2. `src/shared/ui/primitives/components/*`
3. `src/shared/ui/primitives/index.ts`
4. reusable page-level modules in `src/pages/UIKitPage/ui`
5. route-level composition

`src/index.css` is now a bridge layer for Tailwind tokens, gradients, and a
small set of legacy CSS variables. It is not the primary styling source for
primitives anymore.

## Core Rules
- MUI theme is the visual source of truth.
- Shared primitives are the only allowed base control layer.
- Route-level and widget-level code should avoid ad-hoc `className` styling.
- If the same high-level pattern repeats, extract a reusable component instead
  of duplicating `sx`.
- Use `sx` freely inside primitives; use it sparingly in pages and widgets.
- Prefer `Box`, `Typography`, and existing primitives over raw DOM wrappers in
  high-level screens.

## Architecture
- Base controls: `src/shared/ui/primitives`
- Reusable page-shell patterns: `src/pages/UIKitPage/ui`
- Example snippets only: `style_reference/CleanMinimalComponents.tsx`

Do not create another primitive layer in features or pages.

## Visual Character
DVT should feel:
- light
- calm
- technical
- product-oriented
- slightly desktop-like
- soft, not heavy

Avoid:
- marketing-style hero treatments inside product screens
- decorative color planes behind content surfaces
- sharp dark borders on light surfaces
- mixing several radius, border, or shadow systems in one scene

## Theme Guidance
Theme responsibilities:
- palette
- typography
- shape
- overlay defaults
- control defaults
- table defaults
- focus behavior

Primitive wrappers may still add semantic variants, but those variants should
derive from MUI palette tokens instead of hard-coded CSS utility recipes.

## Layout Guidance
Use this hierarchy:
- `Page` for route canvas
- `Panel` for major surface regions
- `Card` for inner sections
- primitive controls for direct interaction

Rules:
- major surfaces need visible air between them
- if two regions visually fuse, they should usually be one surface
- page shells should not rely on dense utility-class compositions

## Control Guidance
Form controls should look like one family:
- same radius system
- same border behavior
- same focus treatment
- same visual density

Use:
- `Field`
- `Input`
- `Textarea`
- `Select`
- `Combobox`
- `DateTimeField`
- `Switch`
- `Checkbox`
- `RadioGroup`

## Overlay Guidance
Use:
- `Dialog` with `DialogHeader`, `DialogContent`, `DialogFooter`
- `Sheet` with `SheetHeader`, `SheetContent`, `SheetFooter`
- `DropdownMenu`
- `Popover`
- `Tooltip`

Do not recreate trigger-based compound APIs in the Radix/shadcn style.
Open state and anchors should be explicit at the call site when needed.

## High-Level Components
For pages, widgets, and showcase screens:
- avoid raw `className` styling where a reusable wrapper or `sx` object would
  be clearer
- if a section heading pattern repeats, extract it
- if a demo field or note block repeats, extract it

Good examples live in:
- `src/pages/UIKitPage/ui/SectionCard.tsx`
- `src/pages/UIKitPage/ui/UIKitShowcase.tsx`
- `style_reference/CleanMinimalComponents.tsx`

## Validation Checklist
Before shipping or finalizing a screen:
- check desktop layout
- check realistic text length
- check focus, hover, disabled states
- check overlay alignment with cards and panels
- check form control consistency
- check that the page still looks like DVT, not like a demo stitched from
  unrelated systems

## Anti-Patterns
- theme values duplicated in feature code
- base controls rebuilt with local `styled` or dense utility classes
- old trigger/content/value compound APIs for MUI overlays and selects
- large decorative slabs behind cards
- repeated page-level `sx` blocks that should be a shared module

## Reference
Use `style_reference/CleanMinimalComponents.tsx` for live examples only.
Rules live here; implementation lives in the primitive layer and theme.
