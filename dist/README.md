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
    "postinstall": "postmon --include src/**/*.ts echo \"Changes detected in your files\""
  }
}
```

## Contributing

To install for development, check out this repo and do `pnpm i && pnpm dev` - then in another terminal you can repeatedly do a `node dist/main.mjs`
