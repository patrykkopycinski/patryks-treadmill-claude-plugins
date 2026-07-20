import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  platform: 'node',
  target: 'node22',
  // esbuild resolves node:sqlite fine on its own (see external comment below)
  // — the actual bug is a tsup DEFAULT: removeNodeProtocol:true unconditionally
  // strips the "node:" prefix off every import matching /^node:/ and marks it
  // external as a bare specifier ("sqlite" instead of "node:sqlite"), which
  // then fails to resolve at runtime with ERR_MODULE_NOT_FOUND because "sqlite"
  // is not a real npm package here. Must be disabled explicitly.
  removeNodeProtocol: false,
  // esbuild 0.27's built-in node-core-module allowlist doesn't yet include
  // node:sqlite (added to Node in 22.5, still experimental) — without this it
  // would otherwise try to bundle it. Keep this pinned explicitly rather than
  // relying on esbuild's default node-builtin detection catching up.
  external: ['node:sqlite'],
});
