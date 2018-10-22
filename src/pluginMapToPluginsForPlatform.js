import { compatMap as defaultCompatMap } from "./compatMap.js"
import { objectFilter, objectValues } from "./objectHelper.js"
import { versionIsBelow } from "./versionCompare.js"

const pluginCompatMapToPlatformVersion = (pluginCompatMap, platformName) => {
  return platformName in pluginCompatMap ? pluginCompatMap[platformName] : "Infinity"
}

const isPlatformCompatible = (pluginCompatMap, platformName, platformVersion) => {
  const compatibleVersion = pluginCompatMapToPlatformVersion(pluginCompatMap, platformName)
  return versionIsBelow(platformVersion, compatibleVersion)
}

const pluginMapForPlatform = (pluginMap, platformName, platformVersion, compatMap) => {
  return objectFilter(pluginMap, (pluginName) => {
    return isPlatformCompatible(
      pluginName in compatMap ? compatMap[pluginName] : {},
      platformName,
      platformVersion,
    )
  })
}

export const pluginMapToPluginsForPlatform = (
  pluginMap,
  platformName,
  platformVersion,
  compatMap = defaultCompatMap,
) => {
  const platformPluginMap = pluginMapForPlatform(
    pluginMap,
    platformName,
    platformVersion,
    compatMap,
  )
  const plugins = objectValues(platformPluginMap)
  return plugins
}
