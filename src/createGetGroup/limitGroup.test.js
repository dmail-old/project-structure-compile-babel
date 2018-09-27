const { limitGroup } = require("../../dist/index.js")
const assert = require("assert")

const getScore = (a) => a.score
const groups = [
  {
    pluginNames: ["a"],
    compatMap: {
      chrome: [50, 27],
    },
    score: 0,
  },
  {
    pluginNames: ["b", "e"],
    compatMap: {
      chrome: [50, 49],
      firefox: [11],
    },
    score: 1,
  },
  {
    pluginNames: ["b", "c"],
    compatMap: {
      chrome: [50, 49],
      firefox: [10],
    },
    score: 2,
  },
]

assert.deepEqual(limitGroup(groups, getScore, 2), [
  {
    pluginNames: ["b", "c"],
    compatMap: {
      chrome: [50, 49],
      firefox: [10],
    },
  },
  {
    pluginNames: ["b", "e", "a"],
    compatMap: {
      firefox: [11],
      chrome: [27],
    },
  },
])
