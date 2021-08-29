# postmon

An npm script that runs another script only if the contents of a directory have changed

## Quickstart

Install to devDependencies

```bash
pnpm add -D https://github.com/binary64/postmon
# or if you like to wait some more, and you use yarn:
yarn add -D https://github.com/binary64/postmon
# or if you like to wait some more even, and you use npm:
npm i -D https://github.com/binary64/postmon
```

Add to your `.gitignore`

```bash
printf "\n.postmon-lock\n" > .gitignore
```

Add to your `package.json` > `"scripts"` > `"post*"` section

```json
{
  "scripts": {
    "postinstall": "postmon --include \"src/**/*.ts\" echo \"Changes detected in your files\""
  }
}
```

## Advanced Configuration

You can add a `.postmon.yml` file to your repo, which describes the graph of code generations to be run. To invoke using this file, simple call `postmon` with no arguments:

```json
{
  "scripts": {
    "postinstall": "postmon"
  }
}
```

The format of `.postmon.yml` is as follows:

```yml
scripts:
  <name>:
    inputs:
      - <file glob>
    outputs:
      - <file glob>
    command: <shell command line>
  ...
```

And example can be found in `examples/prisma-nexus/.postmon.yml`.


## Contributing

To install for development, check out this repo and do `pnpm i && pnpm dev` - then in another terminal you can repeatedly do a `node dist/cli.mjs`
