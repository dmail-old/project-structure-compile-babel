/* eslint-disable no-lone-blocks */
const { compatMapBabel, getPluginNamesForPlatform } = require("../dist/index.js")
const assert = require("assert")

{
  const actual = getPluginNamesForPlatform(compatMapBabel, "node", "8.0")
  const expected = [
    "proposal-async-generator-functions",
    "proposal-json-strings",
    "proposal-object-rest-spread",
    "proposal-optional-catch-binding",
    "proposal-unicode-property-regex",
    "transform-dotall-regex",
  ]
  assert.deepEqual(actual, expected)
}

console.log("passed")
