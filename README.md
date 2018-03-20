# atom-ts-spec-runner

Runs TS specs in Atom.

## USAGE

1.  Add `atom-ts-spec-runner` to `devDependencies`
2.  Add to `package.json`:
    ```json
    {
      ...
      "atomTestRunner": "./node_modules/atom-ts-spec-runner/runner.js",
      ...
    }
    ```
3.  Now `spec/something.spec.ts` files will be run as specs.

Runner needs to know what `tsconfig.json` it should use to compile typescript.
It will search for it recursively starting from `spec` directory and up the
directory tree.
