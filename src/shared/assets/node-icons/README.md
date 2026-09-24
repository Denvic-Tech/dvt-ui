# Node icons

Node definitions provide an optional `icon_key`. The UI owns the SVG artwork and
packages all icons into one external, content-hashed sprite. Unknown or missing
keys keep the existing 8px category marker; legacy `emoji` is not rendered.

## Adding or changing an icon

1. Add the original SVG to a category directory under `src/shared/assets/node-icons`.
   Keep a unique lowercase kebab-case filename. Its basename is the stable API key,
   independent of directory, node class name, language and node version.
2. Include a `viewBox`. Prefer `currentColor` for theme/category coloring;
   explicit colors and root presentation attributes are preserved.
3. Assign `ICON_KEY = "filename-without-extension"` to matching backend nodes.
   Several nodes may share a key. Regenerate the Gateway client after API changes.
4. Run `npm run dev` or `npm run build`. The Vite plugin builds the sprite
   automatically; additions, edits and deletions trigger a dev page refresh.

Source files are preserved, including their metadata. SVGO optimizes the derived
sprite only. IDs inside individual icons are prefixed to avoid collisions.
The set contains 62 SVGs, covering all currently visible built-in nodes,
including mock-data nodes. Five unassigned icons remain available for future
node definitions.

## Rendering and delivery

Import `NodeIcon` from `@/shared/ui/node-icon/NodeIcon` and pass
`iconKey={definition?.icon_key}`. Default size is **16px**; containers retain
their existing backgrounds, category colors and deprecated styling.
Use `size` only when a surface needs another size.

The plugin exports the resource URL and available keys through
`virtual:node-icons`. It never embeds SVG payloads into application JavaScript.
Production emits `assets/node-icons-<hash>.svg`; the hash changes with the
compiled graphics. The UI Nginx serves hashed assets with immutable caching and
SVG gzip compression; HTML revalidates and missing assets return 404.
External SVG references stay on the UI origin.

Run the sprite/component tests with:

```sh
npm run test:run -- plugins/node-icons/index.test.ts src/shared/ui/node-icon/NodeIcon.test.tsx
```

For manual QA check the palette (including pinned items), active project nodes,
add-node menu, graph node headers and data viewer. Verify known icons and default
markers, both themes and browser zoom. With browser caching enabled, cold loading
uses one sprite resource; reopening a project reuses it independently of API
catalog requests.
