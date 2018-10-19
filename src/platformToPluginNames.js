import { versionIsBelow } from "./versionCompare.js"

export const getPlatformVersionForPlugin = (compatMap, pluginName, platformName) => {
  if (pluginName in compatMap === false) {
    throw new Error(`unknown plugin ${pluginName}`)
  }
  const pluginCompatMap = compatMap[pluginName]
  return platformName in pluginCompatMap ? pluginCompatMap[platformName] : "Infinity"
}

export const platformToPluginNames = (compatMap, platformName, platformVersion) => {
  const pluginNames = Object.keys(compatMap)

  return pluginNames
    .filter((pluginName) => {
      const platformVersionForPlugin = getPlatformVersionForPlugin(
        compatMap,
        pluginName,
        platformName,
      )
      return versionIsBelow(platformVersion, platformVersionForPlugin)
    })
    .sort()
}
