module.exports = {
  extends: 'airbnb-typescript-prettier',
  overrides: [
    {
      files: ['*.mjs', '*.cjs'],
      parserOptions: {
        project: [],
        extraFileExtensions: ['mjs', 'cjs'],
      },
      rules: {
        'no-console': 0,
        'import/no-extraneous-dependencies': 0,
      },
    },
  ],
}
