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

const highestVersion = (a, b) => {
  return versionIsAbove(a, b) ? a : b
}

const groupReducer = (previous, group) => {
  const pluginNames = mergePluginNames(previous.pluginNames, group.pluginNames).sort()

  const previousCompatMap = previous.compatMap
  const groupCompatMap = group.compatMap
  const compatMap = { ...previousCompatMap }
  Object.keys(groupCompatMap).forEach((platformName) => {
    groupCompatMap[platformName].forEach((platformVersion) => {
      compatMap[platformName] = String(
        platformName in compatMap
          ? highestVersion(compatMap[platformName], platformVersion)
          : platformVersion,
      )
    })
  })

  return {
    pluginNames,
    compatMap,
  }
}

export const limitGroup = (groups, getScoreForGroup, count = 4) => {
  let i = 0
  const chunkSizes = getChunkSizes(groups, count).reverse()
  const finalGroups = []
  const sortedGroups = groups.sort((a, b) => getScoreForGroup(b) - getScoreForGroup(a))
  let remainingGroups = sortedGroups

  while (i < chunkSizes.length) {
    const groupsToMerge = remainingGroups.slice(0, chunkSizes[i])
    remainingGroups = remainingGroups.slice(chunkSizes[i])
    const mergedGroup = groupsToMerge.reduce(groupReducer, {
      pluginNames: [],
      compatMap: {},
    })
    if (Object.keys(mergedGroup.compatMap).length) {
      finalGroups.push(mergedGroup)
    }
    i++
  }

  return finalGroups
}
