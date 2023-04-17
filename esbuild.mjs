import { nodeExternalsPlugin } from 'esbuild-node-externals'
import { build } from 'esbuild'

console.log('Compiling ...')

build({
  entryPoints: ['src/cli.ts'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: 'dist/cli.mjs',
  sourcemap: true,
  plugins: [nodeExternalsPlugin()],
})
  .then(() => console.log('Compiled.'))
