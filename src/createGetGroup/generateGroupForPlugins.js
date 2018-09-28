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
    if (platformName in compatMap) {
      const compatVersion = compatMap[platformName]
      if (compatVersion in platformCompatMap) {
        platformCompatMap[compatVersion].push(pluginName)
      } else {
        platformCompatMap[compatVersion] = [pluginName]
      }
    } else {
      platformCompatMap.Infinity = [pluginName]
    }
  })

  // add plugin not directly specified as being present for versions
  Object.keys(platformCompatMap).forEach((version) => {
    const pluginNames = platformCompatMap[version]
    plugins.forEach(({ pluginName, compatMap }) => {
      if (pluginNames.indexOf(pluginName) > -1) return
      if (platformName in compatMap === false) return

      const compatVersion = compatMap[platformName]
      if (versionIsAbove(version, compatVersion)) {
        pluginNames.push(pluginName)
      }
    })
  })

  return platformCompatMap
}

const getPlatformNames = (plugins) => {
  const names = []
  plugins.forEach(({ compatMap }) => {
    Object.keys(compatMap).forEach((platformName) => {
      if (names.indexOf(platformName) === -1) {
        names.push(platformName)
      }
    })
  })
  return names
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
      const pluginNames = platformCompatMap[version].sort()
      const existingGroup = groups.find((group) => {
        return group.pluginNames.join("") === pluginNames.join("")
      })
      if (existingGroup) {
        const groupCompatMap = existingGroup.compatMap
        if (platformName in groupCompatMap) {
          groupCompatMap[platformName].push(version)
        } else {
          groupCompatMap[platformName] = [version]
        }
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
