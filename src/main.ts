#!/usr/bin/env node

import hasha from "hasha"
import fg from "fast-glob"
import hashObject from 'hash-obj';
import {promises as fs} from "fs"
import { Command } from 'commander';
import {exec} from 'promisify-child-process'
import pMap from 'p-map';
import {cpus} from 'os'
import {quoteForSh} from 'puka'

const version = "0.0.1"
const lockFileName = ".postmon-lock";

const program = new Command();
program.version(version, '-v, --version', 'output the current version')
.argument("<exec...>", "exec")

program.parse(process.argv);
const args = program.args
console.log("args",args)
console.log("cpus", cpus().length)

;(async () => {

    const numberOfCores = cpus().length
    if (numberOfCores <= 0) {
        console.error("Error, can't detect your CPU")
        process.exit(1)
    }

    console.log("[postmon] Starting... cwd:", process.cwd(), "cores:", numberOfCores)

    console.time("finding files")
    const files = await fg(["**/*.ts"], { dot: true })
    console.timeEnd("finding files")
    console.log("[postmon] Found", files.length, "matches")

    const mapper = async (file: string) => {
        return await hasha.fromFile(file, {algorithm:'md5'});
    };

    console.time("hashing files")
    const matches = await pMap(files, mapper, { concurrency: numberOfCores });
    console.timeEnd("hashing files")

    console.log("[postmon] Rendered", JSON.stringify(matches).length, "bytes of state object")
    
    // console.log(matches)
    console.time("hashing object")
    const overallHash = hashObject([matches.sort(), files.sort()], { algorithm:'sha512' })
    console.timeEnd("hashing object")
    // console.log("Current hash", overallHash)

    let storedHash = "";
    try {
        const fileContents = await fs.readFile(lockFileName)
        storedHash = fileContents.toString()
        // console.log("Lock hash", storedHash)
    } catch {
        console.warn(`[postmon] First time setup -- will create ${lockFileName} file if successful...`)
    }

    if (storedHash === overallHash) {
        console.log("[postmon] No changes detected -- skipping execution.")
        return
    }

    // Execute
    console.log(`[postmon] Executing: ${args.map(e=>quoteForSh(e)).join(" ")}`)
    const output = await exec(args.map(e=>quoteForSh(e)).join(" "), {})
    console.log(output.stdout)

    await fs.writeFile(lockFileName, overallHash)
    console.log(`[postmon] Written new hash to ${lockFileName}`)
})()