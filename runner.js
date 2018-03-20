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

function findPackageDirectory(dir) {
  let packageDirectory = dir

  for (;;) {
    const file = path.resolve(packageDirectory, 'package.json')
    if (fileExists(file)) {
      break
    }
    const parent = path.resolve(packageDirectory, '..')
    if (parent === packageDirectory) {
      throw new Error('atom-ts-spec-runner could not find package directory')
    }
    packageDirectory = parent
  }
  return packageDirectory
}

function getSpecProject(specDirectory) {
  const packageDirectory = findPackageDirectory(specDirectory)
  const packagejson = require(path.resolve(packageDirectory, 'package.json'))
  let project = packagejson.specTSConfig
  if (project != null) return project
  const specTSConfig = path.resolve(specDirectory, 'tsconfig.json')
  const packageTSConfig = path.resolve(packageDirectory, 'tsconfig.json')

  if (fileExists(specTSConfig)) {
    return specTSConfig
  } else if (fileExists(packageTSConfig)) {
    return packageTSConfig
  } else {
    throw new Error('atom-ts-spec-runner could not find spec tsconfig.json')
  }
}

// Configure test runner and export the runner function
const createRunner = require('atom-mocha-test-runner').createRunner

const extraOptions = {
  testSuffixes: ['spec.js', 'spec.coffee', 'spec.ts'],
  globalAtom: false
}

const optionalConfigurationFunction = function(mocha) {
  global.atom = global.buildAtomEnvironment({ enablePersistence: false })
  mocha.timeout(10000)

  const wspcDiv = document.createElement('div')
  wspcDiv.style.height = '30vh'
  wspcDiv.style.width = '100vh'
  wspcDiv.style.overflow = 'hidden'
  document.body.appendChild(wspcDiv)
  window.workspaceDiv = wspcDiv
  wspcDiv.appendChild(atom.views.getView(atom.workspace))
}

const runner = createRunner(extraOptions, optionalConfigurationFunction)

module.exports = function(settings) {
  const { testPaths } = settings
  const project = getSpecProject(testPaths[0])
  register({project})

  return runner(settings)
}
