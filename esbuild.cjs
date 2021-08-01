require('esbuild').build({
  entryPoints: ['src/main.ts'],
  //bundle: true,
  platform: "node",
  outfile: 'dist/main.js',
}).catch(() => process.exit(1))