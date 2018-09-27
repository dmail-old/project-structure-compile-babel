const { createGetScoreForGroupCompatMap } = require("../../dist/index.js")
const assert = require("assert")

const chrome50Score = 1
const chrome49Score = 2
const chromeBelow49Score = 4
const otherScore = 8
const getScore = createGetScoreForGroupCompatMap({
  chrome: {
    "50": chrome50Score,
    "49": chrome49Score,
    "0": chromeBelow49Score,
  },
  other: otherScore,
})

assert.equal(
  getScore({
    chrome: ["51", "49", "48"],
    foo: ["0"],
  }),
  chrome50Score + chrome49Score + chromeBelow49Score + otherScore,
)

console.log("passed")
