# DVT Node Extension Patterns

## Source of Truth

- Resolve `NodeDefinition` from `${VITE_API_BASE_URL}/nodes`.
- Prefer `node_definition.python_module` over UI category labels when locating backend source.
- Backend nodes live under `${BACKEND_PROJECT_PATH}/src/nodes/{category}/{node_file}.py`.
- Frontend extensions live under `src/node-extensions/{category}/{node-name-kebab}`.

## Existing Patterns

- `modal`: `src/node-extensions/tool/create-table`
- `modal_stepper`: `src/node-extensions/extract/read-query-from-db-v3`
- `input_definition`: `src/node-extensions/common/connection-id-input`
- `node_content_top`: `src/node-extensions/widget/text`
- Registry wiring: `src/app/providers/node-extensions/registry.ts`

## UI Checklist

- Search for reusable controls in `src/shared/ui/primitives` first.
- If primitives are not enough, use MUI directly.
- Add custom UI only when primitives and MUI do not cover the case.
- Reuse UI/UX from similar node extensions before inventing a new layout.
- Keep layouts simple; avoid unnecessary nested `Box`, panels, and wrappers.
- Avoid outer border wrappers and border-on-border nesting unless they communicate a real hierarchy the user needs.
- If the dialect behind DB metadata does not support database and/or schema selection, omit those fields from the UI entirely.
- Prefer splitting growing modal editors into smaller components/modules instead of keeping field controls, metadata transforms, and validation in one file.
- Avoid reaching for `sx` first; prefer default component behavior, layout props, shared primitives, and extracted reusable helpers.
- When using `mui.styled`, read values from `src/shared/ui/theme.ts` via `theme`.

## Import Boundaries

- Keep each extension self-contained under `src/node-extensions/<category>/<extension>`.
- Do not import reusable code from sibling extensions.
- Do not create or reuse cross-extension folders like `src/node-extensions/common/*` or `src/node-extensions/*/shared/*`.
- Move pure helpers and types into `src/shared/lib`.
- Move generic UI controls into `src/shared/ui`.
- Move reusable node-editor UI/state blocks into `src/features/node/*`.
- Extension-local files may still use relative imports inside their own extension subtree.

## Questions Before Implementation

- Ask the user if the extension behavior, target inputs, or desired UX cannot be inferred from:
  - `NodeDefinition`
  - backend source
  - existing similar extensions
- Do not guess high-impact behavior such as multi-step flow, destructive actions, or custom validation rules when the source material does not establish them.
