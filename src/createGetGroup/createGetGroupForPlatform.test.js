const { createGetGroupForPlatform } = require("../../dist/index.js")
const assert = require("assert")

{
  const { getGroupForPlatform } = createGetGroupForPlatform({
    requiredPluginNames: ["a"],
    pluginsData: {
      a: {
        chrome: "41",
      },
    },
  })

  assert.deepEqual(
    getGroupForPlatform({
      platformName: "chrome",
      platformVersion: "39",
    }).pluginNames.sort(),
    ["a"],
  )
  assert.deepEqual(
    getGroupForPlatform({
      platformName: "chrome",
      platformVersion: "41",
    }).pluginNames.sort(),
    [],
  )
  assert.deepEqual(
    getGroupForPlatform({
      platformName: "chrome",
      platformVersion: "42",
    }).pluginNames.sort(),
    [],
  )
}

{
  const { getGroupForPlatform } = createGetGroupForPlatform({
    requiredPluginNames: ["a", "b"],
    pluginsData: {
      a: {
        chrome: "41",
      },
      b: {
        chrome: "42",
      },
    },
    size: 1,
  })

  assert.deepEqual(
    getGroupForPlatform({
      platformName: "chrome",
      platformVersion: "41", // even if chrome 41, we serve a because in same group than chrome 42
    }).pluginNames.sort(),
    ["a", "b"],
  )
}

console.log("passed")
