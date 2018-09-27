import { versionIsAbove } from "./versionCompare.js"

const createGetScoreFromVersionUsage = (stats) => {
  const versionNames = Object.keys(stats)
  if (versionNames.length === 0) {
    return () => null
  }
  const sortedVersions = versionNames
    .sort((versionA, versionB) => versionIsAbove(versionA, versionB))
    .reverse()
  const highestVersion = sortedVersions.shift()

  return (platformVersion) => {
    if (platformVersion === highestVersion || versionIsAbove(platformVersion, highestVersion)) {
      return stats[highestVersion]
    }
    const closestVersion = sortedVersions.find((version) => {
      return platformVersion === version || versionIsAbove(platformVersion, version)
    })
    return closestVersion ? stats[closestVersion] : null
  }
}

const createGetScoreFromPlatformUsage = (stats) => {
  const platformNames = Object.keys(stats)
  const scoreMap = {}
  platformNames.forEach((platformName) => {
    scoreMap[platformName] = createGetScoreFromVersionUsage(stats[platformName])
  })
  return (platformName, platformVersion) => {
    if (platformName in scoreMap) {
      const versionUsage = scoreMap[platformName](platformVersion)
      return versionUsage === null ? stats.other : versionUsage
    }
    return stats.other
  }
}

export const createGetScoreForGroupCompatMap = (stats) => {
  const getScoreFromPlatformUsage = createGetScoreFromPlatformUsage(stats)

  const getPlatformScore = (platformName, versions) => {
    return versions.reduce((previous, version) => {
      return previous + getScoreFromPlatformUsage(platformName, version)
    }, 0)
  }

  const getScore = (groupCompatMap) => {
    return Object.keys(groupCompatMap).reduce((previous, platformName) => {
      return previous + getPlatformScore(platformName, groupCompatMap[platformName])
    }, 0)
  }

  return getScore
}
