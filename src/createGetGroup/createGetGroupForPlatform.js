// https://github.com/babel/babel/blob/master/packages/babel-preset-env/data/plugins.json

import { generateGroupFromCompatMap } from "./generateGroupFromCompatMap.js"
import { limitGroup } from "./limitGroup.js"
import { createGetScoreForGroupCompatMap } from "./createGetScoreForGroupCompatMap.js"
import { versionIsBelow } from "./versionCompare.js"
import availablePlugins from "@babel/preset-env/lib/available-plugins.js"

export const defaultPluginsCompatMap = require("@babel/preset-env/data/plugins.json")

export const removePluginsFromCompatMap = (compatMap, pluginNames) => {
  const requiredCompatMap = {}
  pluginNames.forEach((pluginName) => {
    requiredCompatMap[pluginName] = compatMap[pluginName]
  })
  return requiredCompatMap
}

const PLATFORM_NAMES = ["chrome", "edge", "firefox", "safari", "node", "ios", "opera", "electron"]

const defaultStats = {
  chrome: {
    "51": 0.6,
    "44": 0.01,
  },
  firefox: {
    "53": 0.6,
    "0": 0.1, // it means oldest version of firefox will get a score of 0.1
  },
  edge: {
    "12": 0.1,
    "0": 0.001,
  },
  safari: {
    "10": 0.1,
    "0": 0.001,
  },
  node: {
    "8": 0.5,
    "0": 0.001,
  },
  other: 0.001,
}

const getPluginTranpilationComplexity = () => 1

const getGroupTranspilationComplexityScore = (group) =>
  group.pluginNames.reduce(
    (previous, pluginName) => previous + getPluginTranpilationComplexity(pluginName),
    0,
  )

export const getPluginsFromNames = (pluginNames) =>
  pluginNames.map((name) => availablePlugins[name])

export const createGetGroupForPlatform = (
  {
    stats = defaultStats,
    compatMap = defaultPluginsCompatMap,
    size = 4,
    moduleOutput,
    platformNames = PLATFORM_NAMES,
  } = {},
) => {
  // hardcode that nothing supports module for now
  // of course we would like to use
  // https://github.com/babel/babel/blob/090c364a90fe73d36a30707fc612ce037bdbbb24/packages/babel-preset-env/data/built-in-modules.json#L1
  // but let's force it for now
  // and once everything works fine we'll test how it behaves with native modules
  if (moduleOutput === "commonjs") {
    compatMap["transform-modules-commonjs"] = {}
  }
  if (moduleOutput === "systemjs") {
    compatMap["transform-modules-systemjs"] = {}
  }

  const groupWithEverything = {
    pluginNames: Object.keys(compatMap),
    compatMap: {},
  }

  const groupWithNothing = {
    pluginNames: [],
    compatMap: {},
  }

  const allGroups = generateGroupFromCompatMap(compatMap, platformNames)
  const getScoreForGroupCompatMap = createGetScoreForGroupCompatMap(stats)
  const groups = limitGroup(
    allGroups,
    ({ compatMap }) => getScoreForGroupCompatMap(compatMap),
    size,
  )

  const groupsSortedByComplexityToTranspile = groups.sort(
    (a, b) => getGroupTranspilationComplexityScore(a) - getGroupTranspilationComplexityScore(b),
  )

  const getGroupForPlatform = ({ platformName, platformVersion }) => {
    const platformIsUnknown = groups.every(({ compatMap }) => platformName in compatMap === false)
    if (platformIsUnknown) {
      return groupWithEverything
    }

    const groupWithVersionAbovePlatform = groupsSortedByComplexityToTranspile.find(
      ({ compatMap }) => {
        if (platformName in compatMap === false) {
          return false
        }
        return versionIsBelow(platformVersion, compatMap[platformName])
      },
    )
    if (groupWithVersionAbovePlatform) {
      return groupWithVersionAbovePlatform
    }
    return groupWithNothing
  }

  return {
    getGroupForPlatform,
    getAllGroup: () => [groupWithEverything, ...groups, groupWithNothing],
  }
}
