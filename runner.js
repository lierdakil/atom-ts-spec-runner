// Atom already has the capability to require("foo.ts") files, but it's using typescript-simple package at version 1.0,
// that is instead using Typescript 1.4. We want to use whatever version is specified in out package.json, so we kick out
// the typescript-simple handler and install our own via ts-node.
const path = require('path')

if (require.extensions['.ts']) {
  // Because <insert reason>, the ".ts" extension property is read only and not configurable, so we have to replace the
  // whole extensions object to get rid of it.
  const extensions = Object.assign({}, require.extensions)
  delete extensions['.ts']
  require('module')._extensions = extensions
}

// Finally, register ts-node handler
const { register } = require('ts-node')

const fs = require('fs')

function fileExists(file) {
  return fs.existsSync(file) && fs.statSync(file).isFile()
}

function findUpTheTree(start, filename) {
  let packageDirectory = start

  for (;;) {
    const file = path.resolve(packageDirectory, filename)
    if (fileExists(file)) {
      return file
    }
    const parent = path.resolve(packageDirectory, '..')
    if (parent === packageDirectory) {
      const msg = `atom-ts-spec-runner could not find ${filename} in ${start} or any ancestors`
      console.log(msg)
      throw new Error(msg)
    }
    packageDirectory = parent
  }
}

// Configure test runner and export the runner function
const createRunner = require('atom-mocha-test-runner').createRunner

const extraOptions = {
  testSuffixes: ['spec.js', 'spec.coffee', 'spec.ts'],
  globalAtom: false
}

const temp = require('temp').track()

const optionalConfigurationFunction = function(mocha) {
  const atomHome = temp.mkdirSync({prefix: 'atom-test-home-'})
  global.atom = global.buildAtomEnvironment({
    configDirPath: atomHome,
    enablePersistence: false,
    window, document
  })
  mocha.timeout(10000)
}

const runner = createRunner(extraOptions, optionalConfigurationFunction)

module.exports = function(settings) {
  const { testPaths } = settings
  const project = findUpTheTree(testPaths[0], 'tsconfig.json')
  register({ project, transpileOnly: true })

  return runner(settings)
}
