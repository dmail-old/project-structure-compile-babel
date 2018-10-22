/* eslint-disable no-lone-blocks */
const {
  pluginMapToPluginsForPlatform,
  pluginOptionMapToPluginMap,
  pluginNameToPlugin,
} = require("../dist/index.js")
const assert = require("assert")

{
  const pluginMap = pluginOptionMapToPluginMap({
    "transform-block-scoping": {},
    "transform-dotall-regex": "yo",
  })
  const actual = pluginMapToPluginsForPlatform(pluginMap, "node", "8.0")
  const expected = ["transform-dotall-regex"].map((pluginName) => [
    pluginNameToPlugin(pluginName),
    "yo",
  ])
  assert.deepEqual(actual, expected)
}

{
  const pluginOptionsMap = {
    "transform-block-scoping": {},
    "transform-dotall-regex": false,
  }
  const pluginMap = pluginOptionMapToPluginMap(pluginOptionsMap)
  const actual = pluginMapToPluginsForPlatform(pluginMap, "unknown", "8.0")
  const expected = Object.keys(pluginMap).map((pluginName) => [
    pluginNameToPlugin(pluginName),
    pluginOptionsMap[pluginName],
  ])
  assert.deepEqual(actual, expected)
}

console.log("passed")
