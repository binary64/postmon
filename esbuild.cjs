require("esbuild")
  .build({
    entryPoints: ["src/cli.ts"],
    format: "esm",
    platform: "node",
    outfile: "dist/cli.mjs",
    sourcemap: true,
  })
  .catch(() => process.exit(1));
