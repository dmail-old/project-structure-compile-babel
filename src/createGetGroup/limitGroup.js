const mergePluginNames = (pluginList, secondPluginList) => {
  return [...pluginList, ...secondPluginList.filter((plugin) => pluginList.indexOf(plugin) === -1)]
}

const removeFromArray = (array, value) => {
  const index = array.indexOf(value)
  if (index > -1) {
    array.splice(index, 1)
  }
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

export const limitGroup = (groups, getScoreForGroup, count = 4) => {
  if (groups.length <= count) {
    return groups
  }

  let i = 0
  const chunkSizes = getChunkSizes(groups, count).reverse()
  const finalGroups = []
  let remainingGroups = groups

  while (i < chunkSizes.length) {
    const sortedRemainingGroups = remainingGroups
      .sort((a, b) => getScoreForGroup(a) - getScoreForGroup(b))
      .reverse()
    const groupsToMerge = sortedRemainingGroups.slice(0, chunkSizes[i])
    const mergedGroup = groupsToMerge.reduce(
      // eslint-disable-next-line no-loop-func
      (previous, group, index) => {
        const result = {}
        result.pluginNames = mergePluginNames(previous.pluginNames, group.pluginNames)
        const mergedCompatMap = { ...previous.compatMap }
        Object.keys(group.compatMap).forEach((platformName) => {
          const versions = group.compatMap[platformName]
          versions.forEach((platformVersion) => {
            let merged = false
            if (platformName in mergedCompatMap) {
              const mergedVersions = mergedCompatMap[platformName]
              if (mergedVersions.indexOf(platformVersion) === -1) {
                mergedVersions.push(platformVersion)
                merged = true
              }
            } else {
              mergedCompatMap[platformName] = [platformVersion]
              merged = true
            }
            if (merged) {
              sortedRemainingGroups.slice(index + 1).forEach((nextGroup) => {
                if (platformName in nextGroup.compatMap) {
                  removeFromArray(nextGroup.compatMap[platformName], platformVersion)
                }
              })
            }
          })
        })
        result.compatMap = mergedCompatMap
        return result
      },
      {
        pluginNames: [],
        compatMap: {},
      },
    )
    finalGroups.push(mergedGroup)
    remainingGroups = sortedRemainingGroups.slice(chunkSizes[i])
    i++
  }

  return finalGroups
}
