import { versionIsBelow } from "./versionCompare.js"

const getPlatformVersionForPlugin = (compatMap, pluginName, platformName) => {
  if (pluginName in compatMap === false) {
    throw new Error(`unknown plugin ${pluginName}`)
  }
  const pluginCompatMap = compatMap[pluginName]
  return platformName in pluginCompatMap ? pluginCompatMap[platformName] : "Infinity"
}

const getHighestVersionFromPluginNames = (compatMap, pluginNames, platformName) => {
  return pluginNames.reduce((previous, pluginName) => {
    const versionForPlugin = getPlatformVersionForPlugin(compatMap, pluginName, platformName)
    if (versionIsBelow(previous, versionForPlugin)) {
      return String(versionForPlugin)
    }
    return previous
  }, "0")
}

/*
returns
{
	41: ['transform-literals', 'transform-template-literals'], // below 41 we need these plugins
	44: ['transform-template-literals'] // below 44 we need these plugins
	Infinity: [],
}
*/
const getPlatformCompatMap = (compatMap, platformName) => {
  const platformCompatMap = {}

  Object.keys(compatMap).forEach((pluginName) => {
    const platformVersionForPlugin = getPlatformVersionForPlugin(
      compatMap,
      pluginName,
      platformName,
    )
    const pluginNames = [
      ...(platformVersionForPlugin in platformCompatMap
        ? platformCompatMap[platformVersionForPlugin]
        : []),
      pluginName,
    ].sort()
    platformCompatMap[platformVersionForPlugin] = pluginNames
  })

  return platformCompatMap
}

/*
returns
[
	{
		pluginNames: ['transform-literals', 'transform-template-literals',],
		compatMap: {
			chrome: [41, 44]
		},
	},
	{
		pluginNames: ['transform-template-literals'],
		compatMap: {
			chrome: [44]
		},
	},
}


mais ca va pas:

compatMap: {
	a: {
		chrome: 10
	},
	b: {

	}
}

generateGroupFromCompatMap(compatMap, ['chrome'])

on s'attendrais a avoir

[
	{
		pluginNames: ['a'],
		compatMap: {
			chrome: [10]
		}
	},
	{
		pluginNames: ['b'],
		compatMap: {
			chrome: [Infinity]
		}
	},
]

et ensuite en fait pour savoir ce dont on aura vraiment besoin comme plugin
pour chrome 10 c'est seulement b
mais chrome 9 aura besoin de a et b

donc il faudrais surement mieux faire un truc comme ceci en dessous
[
	{
		pluginNames: ['a','b'],
		compatMap: {
			chrome: 10
		}
	},
	{
		pluginNames: ['b'],
		compatMap: {
			chrome: Infinity
		}
	}
}

a reflechir
*/
export const generateGroupFromCompatMap = (compatMap, platformNames) => {
  const platformAndCompatMap = platformNames.map((platformName) => {
    return {
      platformName,
      platformCompatMap: getPlatformCompatMap(compatMap, platformName),
    }
  })

  const groups = []
  platformAndCompatMap.forEach(({ platformName, platformCompatMap }) => {
    Object.keys(platformCompatMap).forEach((version) => {
      const pluginNames = platformCompatMap[version]
      const existingGroup = groups.find((group) => {
        return group.pluginNames.join("") === pluginNames.join("")
      })
      const highestVersion = getHighestVersionFromPluginNames(compatMap, pluginNames, platformName)
      if (existingGroup) {
        const groupCompatMap = existingGroup.compatMap
        groupCompatMap[platformName] = [
          ...(platformName in groupCompatMap ? groupCompatMap[platformName] : []),
          highestVersion,
        ]
      } else {
        groups.push({
          pluginNames,
          compatMap: { [platformName]: [highestVersion] },
        })
      }
    })
  })

  return groups
}
