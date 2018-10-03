'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var fs = _interopDefault(require('fs'));
var availablePlugins = _interopDefault(require('@babel/preset-env/lib/available-plugins.js'));
var path = _interopDefault(require('path'));
var projectStructure = require('@dmail/project-structure');

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

const semver = version => {
  if (typeof version === "number") {
    return {
      major: version,
      minor: 0,
      patch: 0
    };
  }

  if (typeof version === "string") {
    const parts = version.split(".");
    return {
      major: Number(parts[0]),
      minor: parts[1] ? Number(parts[1]) : 0,
      patch: parts[2] ? Number(parts[2]) : 0
    };
  }

  throw new TypeError(`version must be a number or a string, got: ${typeof version}`);
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

const PLATFORM_NAMES = ["chrome", "edge", "firefox", "safari", "node", "ios", "opera", "electron"];
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
    const compatVersion = platformName in compatMap ? compatMap[platformName] : "Infinity";
    platformCompatMap[compatVersion] = _toConsumableArray(compatVersion in platformCompatMap ? platformCompatMap[compatVersion] : []).concat([pluginName]).sort();
  });
  Object.keys(platformCompatMap).forEach(version => {
    const pluginNames = platformCompatMap[version];
    const pluginsUnhandled = plugins.filter(({
      pluginName
    }) => {
      return pluginNames.indexOf(pluginName) === -1;
    });
    pluginsUnhandled.forEach(({
      pluginName,
      compatMap
    }) => {
      const compatVersion = compatMap[platformName] || "Infinity";

      if (versionIsAbove(version, compatVersion)) {
        platformCompatMap[version] = _toConsumableArray(platformCompatMap[version]).concat([pluginName]).sort();
      }
    });
  });
  return platformCompatMap;
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
  const platformAndCompatMap = PLATFORM_NAMES.map(platformName => {
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
      const pluginNames = platformCompatMap[version];
      const existingGroup = groups.find(group => {
        return group.pluginNames.join("") === pluginNames.join("");
      });

      if (existingGroup) {
        const groupCompatMap = existingGroup.compatMap;
        groupCompatMap[platformName] = _toConsumableArray(platformName in groupCompatMap ? groupCompatMap[platformName] : []).concat([version]);
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

const highestVersion = (a, b) => {
  return versionIsAbove(a, b) ? a : b;
};

const groupReducer = (previous, group) => {
  const pluginNames = mergePluginNames(previous.pluginNames, group.pluginNames).sort();
  const previousCompatMap = previous.compatMap;
  const groupCompatMap = group.compatMap;

  const compatMap = _objectSpread({}, previousCompatMap);

  Object.keys(groupCompatMap).forEach(platformName => {
    groupCompatMap[platformName].forEach(platformVersion => {
      compatMap[platformName] = String(platformName in compatMap ? highestVersion(compatMap[platformName], platformVersion) : platformVersion);
    });
  });
  return {
    pluginNames,
    compatMap
  };
};

const limitGroup = (groups, getScoreForGroup, count = 4) => {
  let i = 0;
  const chunkSizes = getChunkSizes(groups, count).reverse();
  const finalGroups = [];
  const sortedGroups = groups.sort((a, b) => getScoreForGroup(b) - getScoreForGroup(a));
  let remainingGroups = sortedGroups;

  while (i < chunkSizes.length) {
    const groupsToMerge = remainingGroups.slice(0, chunkSizes[i]);
    remainingGroups = remainingGroups.slice(chunkSizes[i]);
    const mergedGroup = groupsToMerge.reduce(groupReducer, {
      pluginNames: [],
      compatMap: {}
    });

    if (Object.keys(mergedGroup.compatMap).length) {
      finalGroups.push(mergedGroup);
    }

    i++;
  }

  return finalGroups;
};

const createGetScoreFromVersionUsage = stats => {
  const versionNames = Object.keys(stats);

  if (versionNames.length === 0) {
    return () => null;
  }

  const sortedVersions = versionNames.sort((versionA, versionB) => versionIsBelow(versionA, versionB));
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

const getPluginTranpilationComplexity = () => 1;

const getGroupTranspilationComplexityScore = group => group.pluginNames.reduce((previous, pluginName) => {
  return previous + getPluginTranpilationComplexity(pluginName);
}, 0);

const getPluginsFromNames = pluginNames => pluginNames.map(name => availablePlugins[name]);
const createGetGroupForPlatform = ({
  stats = defaultStats,
  requiredPluginNames = Object.keys(availablePlugins),
  pluginsData = defaultPluginsData,
  size = 4,
  moduleOutput
} = {}) => {
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

  const groupWithEverything = {
    pluginNames: plugins.map(({
      pluginName
    }) => pluginName),
    compatMap: {}
  };
  const groupWithNothing = {
    pluginNames: [],
    compatMap: {}
  };
  const allGroups = generateGroupForPlugins(plugins);
  const getScoreForGroupCompatMap = createGetScoreForGroupCompatMap(stats);
  const groups = limitGroup(allGroups, ({
    compatMap
  }) => getScoreForGroupCompatMap(compatMap), size);
  const groupsSortedByComplexityToTranspile = groups.sort((a, b) => getGroupTranspilationComplexityScore(a) - getGroupTranspilationComplexityScore(b));

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

    const groupWithVersionAbovePlatformVersion = groupsSortedByComplexityToTranspile.find(({
      compatMap
    }) => {
      if (platformName in compatMap === false) {
        return false;
      }

      return versionIsBelow(platformVersion, compatMap[platformName]);
    });

    if (groupWithVersionAbovePlatformVersion) {
      return groupWithVersionAbovePlatformVersion;
    }

    return groupWithNothing;
  };

  return {
    getGroupForPlatform,
    getAllGroup: () => [groupWithEverything].concat(_toConsumableArray(groups), [groupWithNothing])
  };
};

const {
  transformAsync
} = require("@babel/core"); // rollup fails if using import here


const compileFileStructure = ({
  root,
  config = "structure.config.js",
  predicate = ({
    compile
  }) => compile,
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
  const group = getGroupForPlatform({
    platformName,
    platformVersion
  });
  const plugins = getPluginsFromNames(group.pluginNames);

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

  const compileAndWrite = ({
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
  };

  return projectStructure.createFileStructure({
    root,
    config
  }).then(({
    forEachFileMatching
  }) => {
    return forEachFileMatching(predicate, compileAndWrite);
  });
};

exports.writeFileFromString = writeFileFromString;
exports.compileFileStructure = compileFileStructure;
exports.createGetScoreForGroupCompatMap = createGetScoreForGroupCompatMap;
exports.limitGroup = limitGroup;
exports.defaultPluginsData = defaultPluginsData;
exports.createGetGroupForPlatform = createGetGroupForPlatform;
exports.getPluginsFromNames = getPluginsFromNames;
exports.versionIsAbove = versionIsAbove;
exports.versionIsBelow = versionIsBelow;
//# sourceMappingURL=index.js.map
