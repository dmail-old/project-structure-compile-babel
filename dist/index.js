'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var fs = _interopDefault(require('fs'));
var path = _interopDefault(require('path'));

const sequence = require("promise-sequential"); // rollup fails if using import here


const getFileLStat = path$$1 => {
  return new Promise((resolve, reject) => {
    fs.lstat(path$$1, (error, lstat) => {
      if (error) {
        reject({
          status: 500,
          reason: error.code
        });
      } else {
        resolve(lstat);
      }
    });
  });
};

const createFolder = ({
  location
}) => {
  return new Promise((resolve, reject) => {
    fs.mkdir(location, error => {
      if (error) {
        // au cas ou deux script essayent de crée un dossier peu importe qui y arrive c'est ok
        if (error.code === "EEXIST") {
          getFileLStat(location).then(stat => {
            if (stat.isDirectory()) {
              resolve();
            } else {
              reject({
                status: 500,
                reason: "expect a directory"
              });
            }
          });
        } else {
          reject({
            status: 500,
            reason: error.code
          });
        }
      } else {
        resolve();
      }
    });
  });
};

const normalizeSeparation = filename => filename.replace(/\\/g, "/");

const createFolderUntil = ({
  location
}) => {
  let path$$1 = normalizeSeparation(location); // remove first / in case path starts with / (linux)
  // because it would create a "" entry in folders array below
  // tryig to create a folder at ""

  const pathStartsWithSlash = path$$1[0] === "/";

  if (pathStartsWithSlash) {
    path$$1 = path$$1.slice(1);
  }

  const folders = path$$1.split("/");
  folders.pop();
  return sequence(folders.map((_, index) => {
    return () => {
      const folderLocation = folders.slice(0, index + 1).join("/");
      return createFolder({
        location: `${pathStartsWithSlash ? "/" : ""}${folderLocation}`
      });
    };
  }));
};

const writeFileFromString = (location, content) => {
  return createFolderUntil({
    location
  }).then(() => {
    return new Promise((resolve, reject) => {
      fs.writeFile(location, content, error => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  });
};

// https://git-scm.com/docs/gitignore

const match = ({
  patterns,
  parts,
  skipPredicate,
  lastSkipRequired,
  lastPatternRequired,
  matchPart,
  skipUntilStartsMatching = false,
}) => {
  let matched;
  let patternIndex = 0;
  let partIndex = 0;
  let matchIndex = 0;

  if (patterns.length === 0 && parts.length === 0) {
    matched = true;
  } else if (patterns.length === 0 && parts.length) {
    matched = true;
    matchIndex = parts.length;
  } else if (patterns.length && parts.length === 0) {
    matched = false;
  } else {
    matched = true;

    while (true) {
      const pattern = patterns[patternIndex];
      const part = parts[partIndex];
      const isSkipPattern = skipPredicate(pattern);
      const isLastPattern = patternIndex === patterns.length - 1;
      const isLastPart = partIndex === parts.length - 1;

      if (isSkipPattern && isLastPart && isLastPattern) {
        matchIndex += part.length;
        break
      }

      if (isSkipPattern && isLastPattern && isLastPart === false) {
        matchIndex += part.length;
        break
      }

      if (isSkipPattern && isLastPattern === false && isLastPart) {
        // test next pattern on current part
        patternIndex++;
        const nextPatternResult = match({
          patterns: patterns.slice(patternIndex),
          parts: parts.slice(partIndex),
          skipPredicate,
          lastSkipRequired,
          lastPatternRequired,
          matchPart,
        });
        matched = nextPatternResult.matched;
        patternIndex += nextPatternResult.patternIndex;
        partIndex += nextPatternResult.partIndex;

        if (matched && patternIndex === patterns.length - 1) {
          matchIndex += nextPatternResult.matchIndex;
          break
        }
        if (matched && partIndex === parts.length - 1) {
          matchIndex += nextPatternResult.matchIndex;
          break
        }
        if (matched) {
          matchIndex += nextPatternResult.matchIndex;
          continue
        }

        // we still increase the matchIndex by the length of the part because
        // this part has matched even if the full pattern is not satisfied
        matchIndex += part.length;
        break
      }

      if (isSkipPattern && isLastPattern === false && isLastPart === false) {
        // test next pattern on current part
        patternIndex++;

        const skipResult = match({
          patterns: patterns.slice(patternIndex),
          parts: parts.slice(partIndex),
          skipPredicate,
          lastSkipRequired,
          lastPatternRequired,
          matchPart,
          skipUntilStartsMatching: true,
        });

        matched = skipResult.matched;
        patternIndex += skipResult.patternIndex;
        partIndex += skipResult.partIndex;
        matchIndex += skipResult.matchIndex;

        if (matched && patternIndex === patterns.length - 1) {
          break
        }
        if (matched && partIndex === parts.length - 1) {
          break
        }
        if (matched) {
          continue
        }
        break
      }

      const partMatch = matchPart(pattern, part);
      matched = partMatch.matched;
      matchIndex += partMatch.matchIndex;

      if (matched && isLastPattern && isLastPart) {
        break
      }

      if (matched && isLastPattern && isLastPart === false) {
        if (lastPatternRequired) {
          matched = false;
        }
        break
      }

      if (matched && isLastPattern === false && isLastPart) {
        const remainingPatternAreSkip = patterns
          .slice(patternIndex + 1)
          .every((pattern) => skipPredicate(pattern));

        if (remainingPatternAreSkip && lastSkipRequired) {
          matched = false;
          break
        }
        if (remainingPatternAreSkip === false) {
          matched = false;
          break
        }
        break
      }

      if (matched && isLastPattern === false && isLastPart === false) {
        patternIndex++;
        partIndex++;
        continue
      }

      if (matched === false && skipUntilStartsMatching && isLastPart === false) {
        partIndex++; // keep searching for that pattern
        matchIndex++;
        continue
      }

      break
    }

    return {
      matched,
      matchIndex,
      patternIndex,
      partIndex,
    }
  }
};

const locationMatch = (pattern, location) => {
  return match({
    patterns: pattern.split("/"),
    parts: location.split("/"),
    lastPatternRequired: false,
    lastSkipRequired: true,
    skipPredicate: (sequencePattern) => sequencePattern === "**",
    matchPart: (sequencePattern, sequencePart) => {
      return match({
        patterns: sequencePattern.split(""),
        parts: sequencePart.split(""),
        lastPatternRequired: true,
        lastSkipRequired: false,
        skipPredicate: (charPattern) => charPattern === "*",
        matchPart: (charPattern, charSource) => {
          const matched = charPattern === charSource;
          return {
            matched,
            patternIndex: 0,
            partIndex: 0,
            matchIndex: matched ? 1 : 0,
          }
        },
      })
    },
  })
};

const createLocationMeta = ({ mergeMeta = (a, b) => ({ ...a, ...b }) } = {}) => {
  const patternAndMetaList = [];

  const addMetaAtPattern = (pattern, meta = {}) => {
    const existingPattern = patternAndMetaList.find(
      (patternAndMeta) => patternAndMeta.pattern === pattern,
    );
    if (existingPattern) {
      existingPattern.meta = mergeMeta(existingPattern.meta, meta);
    } else {
      patternAndMetaList.push({
        pattern,
        meta,
      });
    }
  };

  const getMetaForLocation = (filename) => {
    return patternAndMetaList.reduce((previousMeta, { pattern, meta }) => {
      const { matched } = locationMatch(pattern, filename);
      return matched ? mergeMeta(previousMeta, meta) : previousMeta
    }, {})
  };

  const canContainsMetaMatching = (filename, metaPredicate) => {
    const matchIndexForFile = filename.split("/").join("").length;
    const partialMatch = patternAndMetaList.some(({ pattern, meta }) => {
      const { matched, matchIndex } = locationMatch(pattern, filename);
      return matched === false && matchIndex >= matchIndexForFile && metaPredicate(meta)
    });
    if (partialMatch) {
      return true
    }

    // no partial match satisfies predicate, does it work on a full match ?
    const meta = getMetaForLocation(filename);
    return Boolean(metaPredicate(meta))
  };

  const toJSON = () => {
    return patternAndMetaList
  };

  return {
    addMetaAtPattern,
    getMetaForLocation,
    canContainsMetaMatching,
    toJSON,
  }
};

const readDirectory = (dirname) =>
  new Promise((resolve, reject) => {
    fs.readdir(dirname, (error, names) => {
      if (error) {
        reject(error);
      } else {
        resolve(names);
      }
    });
  });

const readStat = (filename) =>
  new Promise((resolve, reject) => {
    fs.stat(filename, (error, stat) => {
      if (error) {
        reject(error);
      } else {
        resolve(stat);
      }
    });
  });

const nothingToDo = {};

const forEachFileMatching = (
  { getMetaForLocation, canContainsMetaMatching },
  root,
  metaPredicate,
  callback,
) => {
  const visit = (folderRelativeLocation) => {
    const folderAbsoluteLocation = folderRelativeLocation
      ? `${root}/${folderRelativeLocation}`
      : root;

    return readDirectory(folderAbsoluteLocation).then((names) => {
      return Promise.all(
        names.map((name) => {
          const ressourceRelativeLocation = folderRelativeLocation
            ? `${folderRelativeLocation}/${name}`
            : name;
          const ressourceAbsoluteLocation = `${root}/${ressourceRelativeLocation}`;

          return readStat(ressourceAbsoluteLocation).then((stat) => {
            if (stat.isDirectory()) {
              if (canContainsMetaMatching(ressourceRelativeLocation, metaPredicate) === false) {
                return [nothingToDo]
              }
              return visit(ressourceRelativeLocation)
            }

            const meta = getMetaForLocation(ressourceRelativeLocation);
            if (metaPredicate(meta)) {
              return Promise.resolve(
                callback({
                  absoluteName: ressourceAbsoluteLocation,
                  relativeName: ressourceRelativeLocation,
                  meta,
                }),
              ).then((result) => {
                return [result]
              })
            }
            return [nothingToDo]
          })
        }),
      ).then((results) => {
        return results.reduce((previous, results) => {
          return [...previous, ...results]
        }, [])
      })
    })
  };
  return visit().then((allResults) => {
    return allResults.filter((result) => result !== nothingToDo)
  })
};

const CONFIG_FILE_NAME = "structure.config.js";

const loadMetasForRoot = (root) => {
  return new Promise((resolve, reject) => {
    const filename = `${root}/${CONFIG_FILE_NAME}`;

    let value;
    let errored = false;
    try {
      // eslint-disable-nextline no-dynamic-require
      value = require(filename);
    } catch (e) {
      value = e;
      errored = true;
    }

    if (errored) {
      const error = value;
      if (error && error.code === "MODULE_NOT_FOUND") {
        return reject(new Error(`${filename} not found`))
      }
      if (error && error.code === "SYNTAX_ERROR") {
        console.error(`${filename} contains a syntax error`);
        return reject(error)
      }
      if (error && error.code === "REFERENCE_ERROR") {
        console.error(`${filename} contains a reference error`);
        return reject(error)
      }
      return reject(error)
    }

    const namespace = value;
    const namespaceType = typeof namespace;
    if (namespaceType !== "object") {
      return reject(new TypeError(`${filename} must export an object, got ${namespaceType}`))
    }

    resolve(namespace.metas || {});
  })
};

const createRoot = ({ root, getLocationMeta = () => createLocationMeta() }) => {
  return loadMetasForRoot(root).then((metas) => {
    const locationMeta = getLocationMeta();

    Object.keys(metas).forEach((metaName) => {
      const metaPatterns = metas[metaName];
      Object.keys(metaPatterns).forEach((pattern) => {
        const metaValue = metaPatterns[pattern];
        locationMeta.addMetaAtPattern(pattern, { [metaName]: metaValue });
      });
    });

    const scopedForEachFileMatching = (predicate, callback) =>
      forEachFileMatching(locationMeta, root, predicate, callback);

    const listFileMatching = (predicate) =>
      forEachFileMatching(locationMeta, root, predicate, ({ relativeName }) => relativeName);

    return {
      forEachFileMatching: scopedForEachFileMatching,
      listFileMatching,
    }
  })
};

const getFileContentAsString = location => new Promise((resolve, reject) => {
  fs.readFile(location, (error, buffer) => {
    if (error) {
      reject(error);
    } else {
      resolve(buffer.toString());
    }
  });
});

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    var ownKeys = Object.keys(source);

    if (typeof Object.getOwnPropertySymbols === 'function') {
      ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) {
        return Object.getOwnPropertyDescriptor(source, sym).enumerable;
      }));
    }

    ownKeys.forEach(function (key) {
      _defineProperty(target, key, source[key]);
    });
  }

  return target;
}

function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
}

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  }
}

function _iterableToArray(iter) {
  if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
}

function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance");
}

const semver = versionString => {
  const parts = versionString.split(".");
  return {
    major: parseInt(parts[0]),
    minor: parts[1] ? parseInt(parts[1]) : 0,
    patch: parts[2] ? parseInt(parts[2]) : 0
  };
};

const compareVersion = (versionA, versionB) => {
  const semanticVersionA = semver(versionA);
  const semanticVersionB = semver(versionB);
  const majorDiff = semanticVersionA.major - semanticVersionB.major;

  if (majorDiff > 0) {
    return majorDiff;
  }

  if (majorDiff < 0) {
    return majorDiff;
  }

  const minorDiff = semanticVersionA.minor - semanticVersionB.minor;

  if (minorDiff > 0) {
    return minorDiff;
  }

  if (minorDiff < 0) {
    return minorDiff;
  }

  const patchDiff = semanticVersionA.patch - semanticVersionB.patch;

  if (patchDiff > 0) {
    return patchDiff;
  }

  if (patchDiff < 0) {
    return patchDiff;
  }

  return 0;
};
const versionIsAbove = (versionSupposedAbove, versionSupposedBelow) => {
  return compareVersion(versionSupposedAbove, versionSupposedBelow) > 0;
};
const versionIsBelow = (versionSupposedBelow, versionSupposedAbove) => {
  return compareVersion(versionSupposedBelow, versionSupposedAbove) < 0;
};

/*
it returns
{
	41: ['transform-template-literals'], // means that below 41 we need this plugin
	44: ['transform-template-literals', 'transform-literals']
}
*/

const getPlatformCompatMap = (plugins, platformName) => {
  const platformCompatMap = {};
  plugins.forEach(({
    pluginName,
    compatMap
  }) => {
    if (platformName in compatMap === false) return;
    const compatVersion = compatMap[platformName];

    if (compatVersion in platformCompatMap) {
      platformCompatMap[compatVersion].push(pluginName);
    } else {
      platformCompatMap[compatVersion] = [pluginName];
    }
  }); // add plugin not directly specified as being present for versions

  Object.keys(platformCompatMap).forEach(version => {
    const pluginNames = platformCompatMap[version];
    plugins.forEach(({
      pluginName,
      compatMap
    }) => {
      if (pluginNames.indexOf(pluginName) > -1) return;
      const compatVersion = compatMap[platformName];

      if (versionIsAbove(version, compatVersion)) {
        pluginNames.push(pluginName);
      }
    });
  });
  return platformCompatMap;
};

const getPlatformNames = plugins => {
  const names = [];
  plugins.forEach(({
    compatMap
  }) => {
    Object.keys(compatMap).forEach(platformName => {
      if (names.indexOf(platformName) === -1) {
        names.push(platformName);
      }
    });
  });
  return names;
};
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


const generateGroupForPlugins = plugins => {
  const platformNames = getPlatformNames(plugins);
  const platformAndCompatMap = platformNames.map(platformName => {
    return {
      platformName,
      platformCompatMap: getPlatformCompatMap(plugins, platformName)
    };
  });
  const groups = [];
  platformAndCompatMap.forEach(({
    platformName,
    platformCompatMap
  }) => {
    Object.keys(platformCompatMap).forEach(version => {
      const pluginNames = platformCompatMap[version].sort();
      const existingGroup = groups.find(group => {
        return group.pluginNames.join("") === pluginNames.join("");
      });

      if (existingGroup) {
        const groupCompatMap = existingGroup.compatMap;

        if (platformName in groupCompatMap) {
          groupCompatMap[platformName].push(version);
        } else {
          groupCompatMap[platformName] = [version];
        }
      } else {
        groups.push({
          pluginNames,
          compatMap: {
            [platformName]: [version]
          }
        });
      }
    });
  });
  return groups;
};

const mergePluginNames = (pluginList, secondPluginList) => {
  return _toConsumableArray(pluginList).concat(_toConsumableArray(secondPluginList.filter(plugin => pluginList.indexOf(plugin) === -1)));
};

const removeFromArray = (array, value) => {
  const index = array.indexOf(value);

  if (index > -1) {
    array.splice(index, 1);
  }
};

const getChunkSizes = (array, size) => {
  let i = 0;
  const chunkSize = Math.ceil(array.length / size);
  const chunkSizes = [];

  while (i < array.length) {
    if (i + chunkSize > array.length) {
      const chunkSize = array.length - i;
      i += chunkSize;
      chunkSizes.push(chunkSize);
    } else {
      i += chunkSize;
      chunkSizes.push(chunkSize);
    }
  }

  return chunkSizes;
};

const limitGroup = (groups, getScoreForGroup, count = 4) => {
  if (groups.length <= count) {
    return groups;
  }

  let i = 0;
  const chunkSizes = getChunkSizes(groups, count).reverse();
  const finalGroups = [];
  let remainingGroups = groups;

  while (i < chunkSizes.length) {
    const sortedRemainingGroups = remainingGroups.sort((a, b) => getScoreForGroup(a) - getScoreForGroup(b)).reverse();
    const groupsToMerge = sortedRemainingGroups.slice(0, chunkSizes[i]);
    const mergedGroup = groupsToMerge.reduce( // eslint-disable-next-line no-loop-func
    (previous, group, index) => {
      const result = {};
      result.pluginNames = mergePluginNames(previous.pluginNames, group.pluginNames);

      const mergedCompatMap = _objectSpread({}, previous.compatMap);

      Object.keys(group.compatMap).forEach(platformName => {
        const versions = group.compatMap[platformName];
        versions.forEach(platformVersion => {
          let merged = false;

          if (platformName in mergedCompatMap) {
            const mergedVersions = mergedCompatMap[platformName];

            if (mergedVersions.indexOf(platformVersion) === -1) {
              mergedVersions.push(platformVersion);
              merged = true;
            }
          } else {
            mergedCompatMap[platformName] = [platformVersion];
            merged = true;
          }

          if (merged) {
            sortedRemainingGroups.slice(index + 1).forEach(nextGroup => {
              if (platformName in nextGroup.compatMap) {
                removeFromArray(nextGroup.compatMap[platformName], platformVersion);
              }
            });
          }
        });
      });
      result.compatMap = mergedCompatMap;
      return result;
    }, {
      pluginNames: [],
      compatMap: {}
    });
    finalGroups.push(mergedGroup);
    remainingGroups = sortedRemainingGroups.slice(chunkSizes[i]);
    i++;
  }

  return finalGroups;
};

const createGetScoreFromVersionUsage = stats => {
  const versionNames = Object.keys(stats);

  if (versionNames.length === 0) {
    return () => null;
  }

  const sortedVersions = versionNames.sort((versionA, versionB) => versionIsAbove(versionA, versionB)).reverse();
  const highestVersion = sortedVersions.shift();
  return platformVersion => {
    if (platformVersion === highestVersion || versionIsAbove(platformVersion, highestVersion)) {
      return stats[highestVersion];
    }

    const closestVersion = sortedVersions.find(version => {
      return platformVersion === version || versionIsAbove(platformVersion, version);
    });
    return closestVersion ? stats[closestVersion] : null;
  };
};

const createGetScoreFromPlatformUsage = stats => {
  const platformNames = Object.keys(stats);
  const scoreMap = {};
  platformNames.forEach(platformName => {
    scoreMap[platformName] = createGetScoreFromVersionUsage(stats[platformName]);
  });
  return (platformName, platformVersion) => {
    if (platformName in scoreMap) {
      const versionUsage = scoreMap[platformName](platformVersion);
      return versionUsage === null ? stats.other : versionUsage;
    }

    return stats.other;
  };
};

const createGetScoreForGroupCompatMap = stats => {
  const getScoreFromPlatformUsage = createGetScoreFromPlatformUsage(stats);

  const getPlatformScore = (platformName, versions) => {
    return versions.reduce((previous, version) => {
      return previous + getScoreFromPlatformUsage(platformName, version);
    }, 0);
  };

  const getScore = groupCompatMap => {
    return Object.keys(groupCompatMap).reduce((previous, platformName) => {
      return previous + getPlatformScore(platformName, groupCompatMap[platformName]);
    }, 0);
  };

  return getScore;
};

const availablePlugins = require("@babel/preset-env/lib/available-plugins.js");

const defaultPluginsData = require("@babel/preset-env/data/plugins.json");

const defaultStats = {
  chrome: {
    "51": 0.6,
    "44": 0.01
  },
  firefox: {
    "53": 0.6,
    "0": 0.1 // it means oldest version of firefox will get a score of 0.1

  },
  edge: {
    "12": 0.1,
    "0": 0.001
  },
  safari: {
    "10": 0.1,
    "0": 0.001
  },
  node: {
    "8": 0.5,
    "0": 0.001
  },
  other: 0.001
};
const createGetGroupForPlatform = ({
  stats = defaultStats,
  requiredPluginNames = Object.keys(availablePlugins),
  pluginsData = defaultPluginsData,
  size = 4,
  moduleOutput
} = {}) => {
  const groupWithEverything = {
    pluginNames: requiredPluginNames,
    compatMap: {},
    plugins: requiredPluginNames.map(name => availablePlugins[name])
  };
  const groupWithNothing = {
    pluginNames: [],
    plugins: [],
    compatMap: {}
  };
  const plugins = Object.keys(pluginsData).filter(pluginName => {
    return requiredPluginNames.indexOf(pluginName) > -1;
  }).map(pluginName => {
    return {
      pluginName,
      compatMap: pluginsData[pluginName]
    };
  }); // hardcode that nothing supports module for now
  // of course we would like to use
  // https://github.com/babel/babel/blob/090c364a90fe73d36a30707fc612ce037bdbbb24/packages/babel-preset-env/data/built-in-modules.json#L1
  // but let's force it for now
  // and once everything works fine we'll test how it behaves with native modules

  if (moduleOutput === "commonjs") {
    plugins.push({
      pluginName: "transform-modules-commonjs",
      compatMap: {}
    });
  }

  if (moduleOutput === "systemjs") {
    plugins.push({
      pluginName: "transform-modules-systemjs",
      compatMap: {}
    });
  }

  const allGroups = generateGroupForPlugins(plugins);
  const getScoreForGroupCompatMap = createGetScoreForGroupCompatMap(stats);
  const groups = limitGroup(allGroups, ({
    compatMap
  }) => getScoreForGroupCompatMap(compatMap), size);

  const getGroupForPlatform = ({
    platformName,
    platformVersion
  }) => {
    const platformIsUnknown = groups.every(({
      compatMap
    }) => platformName in compatMap === false);

    if (platformIsUnknown) {
      return groupWithEverything;
    }

    const groupForPlatform = groups.find(({
      compatMap
    }) => {
      if (platformName in compatMap === false) {
        return false;
      }

      const versions = compatMap[platformName];
      const highestVersion = versions.sort((a, b) => versionIsBelow(a, b))[0];
      return versionIsBelow(platformVersion, highestVersion);
    });

    if (groupForPlatform) {
      return _objectSpread({}, groupForPlatform, {
        plugins: groupForPlatform.pluginNames.map(name => availablePlugins[name])
      });
    }

    return groupWithNothing;
  };

  return {
    getGroupForPlatform
  };
};

const {
  transformAsync
} = require("@babel/core"); // rollup fails if using import here


const metaPredicate = ({
  compile
}) => compile;

const compileRoot = ({
  root,
  into = "dist",
  platformName = "node",
  platformVersion = "8.0",
  moduleOutput = "commonjs"
}) => {
  const {
    getGroupForPlatform
  } = createGetGroupForPlatform({
    moduleOutput
  });
  const {
    plugins
  } = getGroupForPlatform({
    platformName,
    platformVersion
  });

  const transpile = ({
    code,
    filename,
    sourceFileName
  }) => {
    return transformAsync(code, {
      plugins,
      filename,
      sourceMaps: true,
      sourceFileName
    });
  };

  return createRoot({
    root
  }).then(({
    forEachFileMatching: forEachFileMatching$$1
  }) => {
    return forEachFileMatching$$1(metaPredicate, ({
      absoluteName,
      relativeName
    }) => {
      return getFileContentAsString(absoluteName).then(source => {
        const buildRelativeName = `${into}/${relativeName}`;
        const buildLocation = `${root}/${buildRelativeName}`;
        const sourceMapName = `${path.basename(relativeName)}.map`;
        const sourceMapLocationForSource = `${sourceMapName}`;
        const sourceMapLocation = `${root}/${into}/${relativeName}.map`;
        const sourceNameForSourceMap = path.relative(path.dirname(sourceMapLocation), absoluteName);
        return transpile({
          code: source,
          filename: absoluteName,
          sourceFileName: sourceNameForSourceMap
        }).then(({
          code,
          map
        }) => {
          if (map) {
            code = `${code}
//# sourceMappingURL=${sourceMapLocationForSource}`;
            return Promise.all([writeFileFromString(buildLocation, code), writeFileFromString(sourceMapLocation, JSON.stringify(map, null, "  "))]);
          }

          return writeFileFromString(buildLocation, code);
        }).then(() => {
          console.log(`${relativeName} -> ${buildRelativeName} `);
        });
      });
    });
  });
};

exports.writeFileFromString = writeFileFromString;
exports.compileRoot = compileRoot;
exports.createGetScoreForGroupCompatMap = createGetScoreForGroupCompatMap;
exports.limitGroup = limitGroup;
exports.createGetGroupForPlatform = createGetGroupForPlatform;
//# sourceMappingURL=index.js.map
