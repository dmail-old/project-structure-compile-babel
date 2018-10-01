import { versionIsAbove } from "./versionCompare.js"

const mergePluginNames = (pluginList, secondPluginList) => {
  return [...pluginList, ...secondPluginList.filter((plugin) => pluginList.indexOf(plugin) === -1)]
}

const getChunkSizes = (array, size) => {
  let i = 0
  const chunkSize = Math.ceil(array.length / size)
  const chunkSizes = []
  while (i < array.length) {
    if (i + chunkSize > array.length) {
      const chunkSize = array.length - i
      i += chunkSize
      chunkSizes.push(chunkSize)
    } else {
      i += chunkSize
      chunkSizes.push(chunkSize)
    }
  }
  return chunkSizes
}

const groupReducer = (previous, group) => {
  const result = {}
  result.pluginNames = mergePluginNames(previous.pluginNames, group.pluginNames).sort()
  const mergedCompatMap = { ...previous.compatMap }
  Object.keys(group.compatMap).forEach((platformName) => {
    const versions = group.compatMap[platformName]
    versions.forEach((platformVersion) => {
      if (platformName in mergedCompatMap) {
        const highestVersion = mergedCompatMap[platformName]
        if (versionIsAbove(platformVersion, highestVersion)) {
          mergedCompatMap[platformName] = String(platformVersion)
        }
      } else {
        mergedCompatMap[platformName] = String(platformVersion)
      }
    })
  })
  result.compatMap = mergedCompatMap
  return result
}

export const limitGroup = (groups, getScoreForGroup, count = 4) => {
  let i = 0
  const chunkSizes = getChunkSizes(groups, count).reverse()
  const finalGroups = []
  let remainingGroups = groups

  while (i < chunkSizes.length) {
    const sortedRemainingGroups = remainingGroups.sort(
      (a, b) => getScoreForGroup(b) - getScoreForGroup(a),
    )
    const groupsToMerge = sortedRemainingGroups.slice(0, chunkSizes[i])
    remainingGroups = sortedRemainingGroups.slice(chunkSizes[i])
    const mergedGroup = groupsToMerge.reduce(
      // eslint-disable-next-line no-loop-func
      (previous, group, index) => {
        const result = groupReducer(previous, group, index)

        // remove all occurences to version or oldest version in next groups
        Object.keys(result.compatMap).forEach((platformName) => {
          const platformVersion = result.compatMap[platformName]

          remainingGroups
            .slice(index)
            .filter(({ compatMap }) => platformName in compatMap)
            .forEach(({ compatMap }) => {
              compatMap[platformName] = compatMap[platformName].filter((nextGroupversion) => {
                return versionIsAbove(nextGroupversion, platformVersion)
              })
            })
        })

        return result
      },
      {
        pluginNames: [],
        compatMap: {},
      },
    )
    if (Object.keys(mergedGroup.compatMap).length) {
      finalGroups.push(mergedGroup)
    }
    i++
  }

  return finalGroups
}
