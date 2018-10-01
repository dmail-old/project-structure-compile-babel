// https://github.com/babel/babel/blob/master/packages/babel-preset-env/data/plugins.json

import { generateGroupForPlugins } from "./generateGroupForPlugins.js"
import { limitGroup } from "./limitGroup.js"
import { createGetScoreForGroupCompatMap } from "./createGetScoreForGroupCompatMap.js"
import { versionIsBelow } from "./versionCompare.js"
import availablePlugins from "@babel/preset-env/lib/available-plugins.js"

const defaultPluginsData = require("@babel/preset-env/data/plugins.json")

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

export const createGetGroupForPlatform = (
  {
    stats = defaultStats,
    requiredPluginNames = Object.keys(availablePlugins),
    pluginsData = defaultPluginsData,
    size = 4,
    moduleOutput,
  } = {},
) => {
  const plugins = Object.keys(pluginsData)
    .filter((pluginName) => {
      return requiredPluginNames.indexOf(pluginName) > -1
    })
    .map((pluginName) => {
      return {
        pluginName,
        compatMap: pluginsData[pluginName],
      }
    })

  // hardcode that nothing supports module for now
  // of course we would like to use
  // https://github.com/babel/babel/blob/090c364a90fe73d36a30707fc612ce037bdbbb24/packages/babel-preset-env/data/built-in-modules.json#L1
  // but let's force it for now
  // and once everything works fine we'll test how it behaves with native modules
  if (moduleOutput === "commonjs") {
    plugins.push({
      pluginName: "transform-modules-commonjs",
      compatMap: {},
    })
  }
  if (moduleOutput === "systemjs") {
    plugins.push({
      pluginName: "transform-modules-systemjs",
      compatMap: {},
    })
  }

  const groupWithEverything = {
    pluginNames: plugins.map(({ pluginName }) => pluginName),
    plugins: plugins.map(({ pluginName }) => availablePlugins[pluginName]),
    compatMap: {},
  }

  const groupWithNothing = {
    pluginNames: [],
    plugins: [],
    compatMap: {},
  }

  const allGroups = generateGroupForPlugins(plugins)
  const getScoreForGroupCompatMap = createGetScoreForGroupCompatMap(stats)
  const groups = limitGroup(
    allGroups,
    ({ compatMap }) => getScoreForGroupCompatMap(compatMap),
    size,
  )

  const getGroupForPlatform = ({ platformName, platformVersion }) => {
    const platformIsUnknown = groups.every(({ compatMap }) => platformName in compatMap === false)
    if (platformIsUnknown) {
      return groupWithEverything
    }

    const groupForPlatform = groups.find(({ compatMap }) => {
      if (platformName in compatMap === false) {
        return false
      }
      return versionIsBelow(platformVersion, compatMap[platformName])
    })
    if (groupForPlatform) {
      return {
        ...groupForPlatform,
        plugins: groupForPlatform.pluginNames.map((name) => availablePlugins[name]),
      }
    }
    return groupWithNothing
  }

  return {
    getGroupForPlatform,
    getAllGroup: () => [groupWithEverything, ...groups, groupWithNothing],
  }
}
