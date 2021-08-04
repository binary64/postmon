#!/usr/bin/env node

import hasha from "hasha"
import fg from "fast-glob"
import hashObject from 'hash-obj';
import fs from "fs-extra"
import {Command} from 'commander';
import {exec} from 'promisify-child-process'
import pMap from 'p-map';
import {cpus} from 'os'
import {quoteForSh} from 'puka'
import {version} from '../package.json'

console.log("[postmon] Starting...")

const {writeFile, readFile} = fs

//const version = "0.0.1"
const lockFileName = ".postmon-lock";

const program = new Command();
const {args} = program.version(version, '-v, --version', 'output the current version')
.option("-d, --debug", "Echo additional debugging messages")
.option("-i, --include <glob>", "File glob to scan for changes")
.argument("<exec...>", "Command line to execute if there are changes")
.parse(process.argv)

const {debug,include} = program.opts()

if (debug) console.log("args", args)
if (debug) console.log("cpus", cpus().length)

;(async () => {

    const numberOfCores = cpus().length
    if (numberOfCores <= 0) {
        console.error("Error, can't detect your CPU")
        process.exit(1)
    }

    if (debug) console.log("[postmon] cwd:", process.cwd(), "cores:", numberOfCores)
    if (debug) console.log("[postmon] include: " + JSON.stringify(include))

    if (debug) console.time("finding files")
    const files = await fg(include, { dot: true })
    if (debug) console.timeEnd("finding files")
    if (debug) console.log("[postmon] Found", files.length, "matches")

    const mapper = async (file: string) => {
        return await hasha.fromFile(file, {algorithm:'md5'});
    };

    if (debug) console.time("hashing files")
    const matches = await pMap(files, mapper, { concurrency: numberOfCores });
    if (debug) console.timeEnd("hashing files")

    if (debug) console.log("rendered", JSON.stringify(matches).length, "bytes of state object")
    
    // console.log(matches)
    if (debug) console.time("hashing object")
    const overallHash = hashObject([matches.sort(), files.sort()], { algorithm:'sha512' })
    if (debug) console.timeEnd("hashing object")
    // console.log("Current hash", overallHash)

    let storedHash = "";
    try {
        const fileContents = await readFile(lockFileName)
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

    await writeFile(lockFileName, overallHash)
    console.log(`[postmon] Written new hash to ${lockFileName}`)
})()