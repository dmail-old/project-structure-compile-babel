const { createGetGroupForPlatform } = require("../../dist/index.js")
const assert = require("assert")

{
  const { getGroupForPlatform } = createGetGroupForPlatform({
    compatMap: {
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
    compatMap: {
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

{
  const { getGroupForPlatform } = createGetGroupForPlatform({
    compatMap: {
      a: {
        chrome: "60",
      },
    },
    size: 1,
  })

  assert.deepEqual(
    getGroupForPlatform({
      platformName: "firefox",
      platformVersion: "70",
    }).pluginNames.sort(),
    ["a"],
  )
}

{
  const { getGroupForPlatform } = createGetGroupForPlatform({
    compatMap: {
      a: {},
    },
    size: 1,
  })

  assert.deepEqual(
    getGroupForPlatform({
      platformName: "chrome",
      platformVersion: "50", // even if chrome 41, we serve a because in same group than chrome 42
    }).pluginNames.sort(),
    ["a"],
  )
}

{
  const { getGroupForPlatform } = createGetGroupForPlatform({
    moduleOutput: "commonjs",
    compatMap: {
      a: {
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
    ["a", "transform-modules-commonjs"],
  )
}

{
  const { getGroupForPlatform } = createGetGroupForPlatform({
    compatMap: {
      a: {
        chrome: "42",
      },
      b: {},
    },
    size: 4,
  })

  assert.deepEqual(
    getGroupForPlatform({
      platformName: "chrome",
      platformVersion: "45",
    }).pluginNames.sort(),
    ["b"],
  )
}

{
  const { getGroupForPlatform } = createGetGroupForPlatform({
    platformNames: ["node"],
  })

  const actual = getGroupForPlatform({
    platformName: "node",
    platformVersion: "8.0",
  }).pluginNames
  const expected = []

  assert.deepEqual(actual, expected)
}

console.log("passed")
