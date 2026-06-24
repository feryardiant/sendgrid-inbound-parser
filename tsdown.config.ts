import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  deps: {
    skipNodeModulesBundle: true,
  },
  exports: {
    devExports: true,
  },
  sourcemap: true,
})
