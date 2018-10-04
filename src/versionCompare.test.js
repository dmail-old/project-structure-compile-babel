/* eslint-disable no-lone-blocks */
const { versionIsAbove, versionIsBelow } = require("../dist/index.js")
const assert = require("assert")

{
  assert.equal(versionIsAbove("10", "9"), true)
  assert.equal(versionIsAbove("9", "10"), false)
  assert.equal(versionIsAbove("10", "10"), false)

  assert.equal(versionIsAbove("10.1", "10.0"), true)
  assert.equal(versionIsAbove("10.0", "10.1"), false)
  assert.equal(versionIsAbove("10.1", "10.1"), false)

  assert.equal(versionIsAbove("10.0.2", "10.0.1"), true)
  assert.equal(versionIsAbove("10.0.1", "10.0.2"), false)
  assert.equal(versionIsAbove("10.0.2", "10.0.2"), false)

  assert.equal(versionIsAbove("Infinity", "100000"), true)
  assert.equal(versionIsAbove("100000", "Infinity"), false)
  assert.equal(versionIsAbove("Infinity", "Infinity"), false)
}

{
  assert.equal(versionIsBelow("10", "9"), false)
  assert.equal(versionIsBelow("9", "10"), true)
  assert.equal(versionIsBelow("10", "10"), false)

  assert.equal(versionIsBelow("10.1", "10.0"), false)
  assert.equal(versionIsBelow("10.0", "10.1"), true)
  assert.equal(versionIsBelow("10.1", "10.1"), false)

  assert.equal(versionIsBelow("10.0.2", "10.0.1"), false)
  assert.equal(versionIsBelow("10.0.1", "10.0.2"), true)
  assert.equal(versionIsBelow("10.0.2", "10.0.2"), false)

  assert.equal(versionIsBelow("Infinity", "100000"), false)
  assert.equal(versionIsBelow("100000", "Infinity"), true)
  assert.equal(versionIsBelow("Infinity", "Infinity"), false)
}

console.log("passed")
