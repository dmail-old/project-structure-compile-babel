import { versionIsAbove } from "./versionCompare.js"

const PLATFORM_NAMES = ["chrome", "edge", "firefox", "safari", "node", "ios", "opera", "electron"]

/*
it returns
{
	41: ['transform-template-literals'], // means that below 41 we need this plugin
	44: ['transform-template-literals', 'transform-literals']
}
*/
const getPlatformCompatMap = (plugins, platformName) => {
  const platformCompatMap = {}

  plugins.forEach(({ pluginName, compatMap }) => {
    const compatVersion = platformName in compatMap ? compatMap[platformName] : "Infinity"
    platformCompatMap[compatVersion] = [
      ...(compatVersion in platformCompatMap ? platformCompatMap[compatVersion] : []),
      pluginName,
    ].sort()
  })

  Object.keys(platformCompatMap).forEach((version) => {
    const pluginNames = platformCompatMap[version]
    const pluginsUnhandled = plugins.filter(({ pluginName }) => {
      return pluginNames.indexOf(pluginName) === -1
    })
    pluginsUnhandled.forEach(({ pluginName, compatMap }) => {
      const compatVersion = compatMap[platformName] || "Infinity"
      if (versionIsAbove(version, compatVersion)) {
        platformCompatMap[version] = [...platformCompatMap[version], pluginName].sort()
      }
    })
  })

  return platformCompatMap
}

/*
it returns
[
	{
		features: ['transform-template-literals'],
		platforms: {
			chrome: [44, 45]
		},
	},
	{
		features: ['transform-template-literals', 'transform-literals'],
		platforms: {
			chrome: [44]
		},
	},
}
*/
export const generateGroupForPlugins = (plugins) => {
  const platformAndCompatMap = PLATFORM_NAMES.map((platformName) => {
    return {
      platformName,
      platformCompatMap: getPlatformCompatMap(plugins, platformName),
    }
  })

  const groups = []
  platformAndCompatMap.forEach(({ platformName, platformCompatMap }) => {
    Object.keys(platformCompatMap).forEach((version) => {
      const pluginNames = platformCompatMap[version]
      const existingGroup = groups.find((group) => {
        return group.pluginNames.join("") === pluginNames.join("")
      })
      if (existingGroup) {
        const groupCompatMap = existingGroup.compatMap
        groupCompatMap[platformName] = [
          ...(platformName in groupCompatMap ? groupCompatMap[platformName] : []),
          version,
        ]
      } else {
        groups.push({
          pluginNames,
          compatMap: { [platformName]: [version] },
        })
      }
    })
  })

  return groups
}
