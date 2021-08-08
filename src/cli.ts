#!/usr/bin/env node
/* eslint-disable no-console */

import hasha from 'hasha'
import fg from 'fast-glob'
import hashObject from 'hash-obj'
import fs from 'fs-extra'
import { Command } from 'commander'
import { spawnSync as exec } from 'child_process'
import pMap from 'p-map'
import { cpus } from 'os'
import { quoteForSh } from 'puka'
import jsYaml from 'js-yaml'

const { writeFile, readFile } = fs

const { version } = JSON.parse(
  (await readFile(new URL('../package.json', import.meta.url))).toString()
)
const lockFileName = '.postmon-lock'

function log(message: string, ...rest: any[]): void {
  // eslint-disable-next-line no-console
  console.log(`[postmon] ${message}`, ...rest)
}

log('Starting', version)

const program = new Command()
const { args } = program
  .version(version, '-v, --version', 'output the current version')
  .option('-d, --debug', 'Echo additional debugging messages')
  .option('-i, --include <glob>', 'File glob to scan for changes')
  .option('--name <name>', 'A string identifer for this execution')
  .argument('[exec...]', 'Command line to execute if there are changes')
  .parse(process.argv)

const opts = program.opts()
const debug = true

const numberOfCpus = cpus()?.length
if (!numberOfCpus || numberOfCpus <= 0) {
  log("Error, can't detect your CPU")
  log('result:', cpus())
  process.exit(1)
}
const numberOfCores = Math.max(1, Math.round(numberOfCpus / 2))

if (debug) {
  log('args', args)
  log('cpus', cpus().length)
  log('cwd:', process.cwd())
  log('cores:', numberOfCores)
  log('include', opts.include)
}

async function getHashOfDirectory(directoryGlobs: string | string[]) {
  if (debug) console.time('finding files', directoryGlobs)
  const files = await fg(directoryGlobs, { dot: true })
  if (debug) console.timeEnd('finding files')
  if (debug) console.log('Found', files.length, 'matches')

  const mapper = async (file: string) => {
    return hasha.fromFile(file, { algorithm: 'md5' })
  }

  if (debug) console.time('hashing files')
  const matches = await pMap(files, mapper, { concurrency: numberOfCores })
  if (debug) console.timeEnd('hashing files')

  if (debug)
    console.log(
      'rendered',
      JSON.stringify(matches).length,
      'bytes of state object'
    )

  if (debug) console.time('hashing object')
  const ret = hashObject([matches.sort(), files.sort()], {
    algorithm: 'sha512',
  })
  if (debug) console.timeEnd('hashing object')

  return ret
}

interface PostmonConfig {
  scripts: {
    [name: string]: PostmonConfigExecution
  }
}
interface PostmonConfigExecution {
  command: string
  inputs: string[]
  outputs?: string[]
}

function isDocumentWithKey<T>(keyName: string) {
  return function (e: any): e is T {
    return typeof e === 'object' && keyName in e
  }
}

async function doTask(
  directoryGlob: string | string[],
  name = 'default',
  commandLine: string
) {
  if (!commandLine) throw new Error('Must have a commandLine')

  console.log(name, directoryGlob)

  const overallHash = await getHashOfDirectory(directoryGlob)
  if (debug) log('Current hash', overallHash)

  const rawFile = (await readFile(lockFileName)).toString()

  const storedHashes =
    (rawFile[0] === '{' && (JSON.parse(rawFile) as Record<string, string>)) ||
    {}

  if (Object.keys(storedHashes).length === 0)
    log(`First time setup -- will create ${lockFileName} file if successful...`)

  if (storedHashes?.[name] === overallHash) {
    log(`No changes detected -- skipping execution.`)
    return
  }

  // Execute
  log(`Executing: ${commandLine}`)
  const output = exec(commandLine, {
    shell: true,
    stdio: 'inherit',
  })
  if (debug) log('output', output)

  // Store results
  if (output.status === 0) {
    await writeFile(
      lockFileName,
      JSON.stringify({ ...storedHashes, [name]: overallHash })
    )
    log(`Written new hash for '${name}' to ${lockFileName}`)
  }
}

;(async () => {
  if (opts.include)
    doTask(opts.include, opts.name, args.map((e) => quoteForSh(e)).join(' '))
  else {
    // Read from .postmon.yml
    const yml = jsYaml
      .loadAll(fs.readFileSync('.postmon.yml').toString())
      .find(isDocumentWithKey<PostmonConfig>('scripts'))
    if (!yml) throw new Error('Define a .postmon.yml file first.')

    // Run em all, who cares about Zen2 contention anyway
    const mapper = ([name, { inputs, command }]) =>
      doTask(inputs, name, command)
    await pMap(
      Object.entries(yml.scripts).filter(([, { command }]) => !!command),
      mapper,
      { concurrency: 1 }
    )

    console.log('All done.')
  }
})()
