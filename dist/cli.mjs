#!/usr/bin/env node
import hasha from "hasha";
import fg from "fast-glob";
import hashObject from "hash-obj";
import fs from "fs-extra";
import { Command } from "commander";
import { spawnSync as exec } from "child_process";
import pMap from "p-map";
import { cpus } from "os";
import { quoteForSh } from "puka";
const { writeFile, readFile } = fs;
const { version } = JSON.parse((await readFile(new URL("../package.json", import.meta.url))).toString());
const lockFileName = ".postmon-lock";
function log(message, ...rest) {
  console.log(`[postmon] ${message}`, ...rest);
}
log("Starting", version);
const program = new Command();
const { args } = program.version(version, "-v, --version", "output the current version").option("-d, --debug", "Echo additional debugging messages").option("-i, --include <glob>", "File glob to scan for changes").argument("[exec...]", "Command line to execute if there are changes").parse(process.argv);
const { include } = program.opts();
const debug = true;
const numberOfCpus = cpus()?.length;
if (!numberOfCpus || numberOfCpus <= 0) {
  log("Error, can't detect your CPU");
  log("result:", cpus());
  process.exit(1);
}
const numberOfCores = Math.max(1, Math.round(numberOfCpus / 2));
if (debug) {
  log("args", args);
  log("cpus", cpus().length);
  log("cwd:", process.cwd());
  log("cores:", numberOfCores);
  log("include", include);
}
async function doTask(include2) {
  if (debug)
    console.time("finding files", include2);
  const files = await fg(include2, { dot: true });
  if (debug)
    console.timeEnd("finding files");
  if (debug)
    console.log("Found", files.length, "matches");
  const mapper = async (file) => {
    return hasha.fromFile(file, { algorithm: "md5" });
  };
  if (debug)
    console.time("hashing files");
  const matches = await pMap(files, mapper, { concurrency: numberOfCores });
  if (debug)
    console.timeEnd("hashing files");
  if (debug)
    console.log("rendered", JSON.stringify(matches).length, "bytes of state object");
  if (debug)
    console.time("hashing object");
  const overallHash = hashObject([matches.sort(), files.sort()], {
    algorithm: "sha512"
  });
  if (debug)
    console.timeEnd("hashing object");
  if (debug)
    log("Current hash", overallHash);
  let storedHash = "";
  try {
    const fileContents = await readFile(lockFileName);
    storedHash = fileContents.toString();
    if (debug)
      log("Lock hash", storedHash);
  } catch {
    log(`First time setup -- will create ${lockFileName} file if successful...`);
  }
  if (storedHash === overallHash) {
    log(`No changes detected in ${files.length} files -- skipping execution.`);
    return;
  }
  log(`Executing: ${args.map((e) => quoteForSh(e)).join(" ")}`);
  const output = exec(args.map((e) => quoteForSh(e)).join(" "), {
    shell: true,
    stdio: "inherit"
  });
  if (debug)
    log("output", output);
  if (output.status === 0) {
    await writeFile(lockFileName, overallHash);
    log(`Written new hash to ${lockFileName}`);
  }
}
;
(async () => {
  if (include)
    doTask(include);
})();
//# sourceMappingURL=cli.mjs.map
