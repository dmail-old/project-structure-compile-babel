const { generateGroupFromCompatMap, defaultPluginsCompatMap } = require("../../dist/index.js")
const assert = require("assert")

// {
//   const compatMap = {
//     a: {
//       chrome: 41,
//     },
//     b: {
//       chrome: 44,
//     },
//   }

//   const actual = generateGroupFromCompatMap(compatMap, ["chrome"])
//   const expected = [
//     {
//       pluginNames: ["a", "b"],
//       compatMap: { chrome: ["44"] },
//     },
//     {
//       pluginNames: ["b"],
//       compatMap: { chrome: ["44"] },
//     },
//   ]
//   assert.deepEqual(actual, expected)
// }

{
  const actual = generateGroupFromCompatMap(defaultPluginsCompatMap, ["chrome"])
  const expected = [
    {
      pluginNames: ["a", "b"],
      compatMap: { chrome: ["44"] },
    },
    {
      pluginNames: ["b"],
      compatMap: { chrome: ["44"] },
    },
  ]
  assert.deepEqual(actual, expected)
}
