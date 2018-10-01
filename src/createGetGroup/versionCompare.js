const semver = (version) => {
  if (typeof version === "number") {
    return {
      major: version,
      minor: 0,
      patch: 0,
    }
  }
  if (typeof version === "string") {
    const parts = version.split(".")
    return {
      major: Number(parts[0]),
      minor: parts[1] ? Number(parts[1]) : 0,
      patch: parts[2] ? Number(parts[2]) : 0,
    }
  }
  throw new TypeError(`version must be a number or a string, got: ${typeof version}`)
}

export const compareVersion = (versionA, versionB) => {
  const semanticVersionA = semver(versionA)
  const semanticVersionB = semver(versionB)

  const majorDiff = semanticVersionA.major - semanticVersionB.major
  if (majorDiff > 0) {
    return majorDiff
  }
  if (majorDiff < 0) {
    return majorDiff
  }

  const minorDiff = semanticVersionA.minor - semanticVersionB.minor
  if (minorDiff > 0) {
    return minorDiff
  }
  if (minorDiff < 0) {
    return minorDiff
  }

  const patchDiff = semanticVersionA.patch - semanticVersionB.patch
  if (patchDiff > 0) {
    return patchDiff
  }
  if (patchDiff < 0) {
    return patchDiff
  }

  return 0
}

export const versionIsAbove = (versionSupposedAbove, versionSupposedBelow) => {
  return compareVersion(versionSupposedAbove, versionSupposedBelow) > 0
}

export const versionIsBelow = (versionSupposedBelow, versionSupposedAbove) => {
  return compareVersion(versionSupposedBelow, versionSupposedAbove) < 0
}