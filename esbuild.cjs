require("esbuild")
  .build({
    entryPoints: ["src/main.ts"],
    bundle: true,
    format: "esm",
    platform: "node",
    outfile: "dist/main.mjs",
    sourcemap: true,
    external: [
      "hasha",
      "fs-extra",
      "commander",
      "promisify-child-process",
      "fast-glob",
    ],
  })
  .catch(() => process.exit(1));
