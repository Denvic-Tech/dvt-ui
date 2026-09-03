---
name: dvt-node-extension-builder
description: Prepare context and scaffold DVT node extensions for node names in the dvt_ui repository. Use when Codex needs to create or extend an extension under src/node-extensions, resolve a NodeDefinition from the backend /nodes API, locate the paired backend source under BACKEND_PROJECT_PATH/src/nodes, generate a starter for modal/modal_stepper/node_content/context_menu/input_definition extensions, or follow existing DVT UI and UX patterns for node editors.
---

# DVT Node Extension Builder

## Overview

Use this skill to remove the repetitive setup around new node extensions in DVT:

- resolve the target node from the backend `/nodes` API, even when the user gives a non-normalized name;
- find the paired backend source file under `${BACKEND_PROJECT_PATH}/src/nodes/...`;
- scaffold the frontend extension directory under `src/node-extensions/{category}/{node-name-kebab}`;
- stay aligned with existing DVT extension patterns and local UI conventions.

Read [references/dvt-node-extension-patterns.md](references/dvt-node-extension-patterns.md) before implementing the
actual UI.

## Workflow

### 1. Prepare context

Run `scripts/prepare_node_context.py` when you need to inspect the node first or when the request is still ambiguous.

Use:

```powershell
& "$env:BACKEND_PROJECT_PATH\.venv3.13\Scripts\python.exe" `
  ".codex/skills/dvt-node-extension-builder/scripts/prepare_node_context.py" `
  --node-name "CreateTable"
```

What it does:

- reads `.env` from the repo;
- resolves `${VITE_API_BASE_URL}` to the backend `/nodes` endpoint;
- matches the node by exact name, normalized name, then fuzzy score;
- uses `python_module` as the primary backend lookup;
- falls back to AST scan in `${BACKEND_PROJECT_PATH}/src/nodes` when needed;
- emits a JSON context with backend path, frontend target dir, naming, and suggested input attr.

### 2. Scaffold the extension

Run `scripts/scaffold_node_extension.py` when you already have a prepared context JSON.

Supported extension types:

- `NodeModalExtension` (default)
- `NodeModalStepperExtension`
- `NodeContentExtension`
- `NodeContextMenuExtension`
- `NodeInputDefinitionExtension`

Use:

```powershell
& "$env:BACKEND_PROJECT_PATH\.venv3.13\Scripts\python.exe" `
  ".codex/skills/dvt-node-extension-builder/scripts/scaffold_node_extension.py" `
  --context-file ".tmp/create-table-context.json" `
  --extension-type "NodeModalExtension"
```

Notes:

- Use `--content-slot bottom` only with `NodeContentExtension`.
- Use `--register` only when you want the script to update `src/app/providers/node-extensions/registry.ts`.
- Use `--dry-run` to inspect planned paths and files before writing.

### 3. Do it in one command

Run `scripts/bootstrap_node_extension.py` when the user wants the full prepare + scaffold flow in one shot.

Use:

```powershell
& "$env:BACKEND_PROJECT_PATH\.venv3.13\Scripts\python.exe" `
  ".codex/skills/dvt-node-extension-builder/scripts/bootstrap_node_extension.py" `
  --node-name "CreateTable" `
  --extension-type "NodeModalExtension" `
  --dry-run
```

## Implementation Rules

- Check `src/shared/ui/primitives` first for reusable UI building blocks.
- If primitives are not enough, use MUI.
- Add custom UI only when primitives and MUI still do not fit.
- Reuse UI and UX from similar existing node extensions before inventing new layouts.
- Keep the design simple and shallow; avoid unnecessary nested panels, `Box`, and wrapper stacks.
- Avoid extra visual chrome: do not add outer bordered shells or nested border-on-border containers unless the UX truly
  requires separation.
- Treat `src/node-extensions/<category>/<extension>` as an isolated leaf. Do not import reusable code from sibling
  extensions and do not introduce new `src/node-extensions/common/*` or `src/node-extensions/*/shared/*` folders.
- When code is reused across two or more extensions, move it out of `src/node-extensions`: pure logic goes to
  `src/shared/lib`, generic controls to `src/shared/ui`, and reusable node-editor blocks to `src/features/node/*`.
- Prefer composition over monoliths: split modal extensions into small components/modules when a single file starts
  owning layout, field rendering, metadata mapping, validation wiring, and serialization at once.
- Avoid excessive `sx`/inline style overrides. First use existing component defaults, layout props, shared primitives,
  or extracted helpers. Add custom styling only when the UI requirement cannot be met cleanly otherwise.
- When using `mui.styled`, derive values from `theme` in `src/shared/ui/theme.ts`.
- Treat the generated scaffold as a starting point, not a finished extension.

## Questions To Ask

Ask the user when important behavior is still unclear after reading:

- the prepared context JSON;
- the backend source file;
- similar existing node extensions.

Ask instead of guessing when the missing detail affects:

- which inputs the extension edits;
- whether the flow should be modal vs stepper;
- destructive actions or side effects;
- unusual validation or UX requirements.

## Resources

### scripts/

- `prepare_node_context.py`: resolve node definition, backend source, frontend target path.
- `scaffold_node_extension.py`: generate the extension directory and type-specific skeleton.
- `bootstrap_node_extension.py`: run prepare + scaffold in one command.

### references/

- `dvt-node-extension-patterns.md`: project-specific naming, wiring, and UI guidance.

### assets/

- `assets/templates/`: starter templates for each supported extension type.
