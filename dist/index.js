'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var fs = _interopDefault(require('fs'));
var availablePlugins = _interopDefault(require('@babel/preset-env/lib/available-plugins.js'));
var path = _interopDefault(require('path'));
var projectStructure = require('@dmail/project-structure');

const pluginJSON = require("@babel/preset-env/data/plugins.json");

const compatMapBabel = pluginJSON;

const fileReadAsString = location => new Promise((resolve, reject) => {
  fs.readFile(location, (error, buffer) => {
    if (error) {
      reject(error);
    } else {
      resolve(buffer.toString());
    }
  });
});

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

const fileWriteFromString = (location, content) => {
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

const semver = version => {
  if (typeof version === "number") {
    return {
      major: version,
      minor: 0,
      patch: 0
    };
  }

  if (typeof version === "string") {
    if (version.indexOf(".") > -1) {
      const parts = version.split(".");
      return {
        major: Number(parts[0]),
        minor: parts[1] ? Number(parts[1]) : 0,
        patch: parts[2] ? Number(parts[2]) : 0
      };
    }

    if (isNaN(version)) {
      return {
        major: 0,
        minor: 0,
        patch: 0
      };
    }

    return {
      major: Number(version),
      minor: 0,
      patch: 0
    };
  }

  throw new TypeError(`version must be a number or a string, got: ${typeof version}`);
};

const versionCompare = (versionA, versionB) => {
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
const versionEqual = (versionA, versionB) => {
  return String(versionA) === String(versionB);
};
const versionIsAbove = (versionSupposedAbove, versionSupposedBelow) => {
  return versionCompare(versionSupposedAbove, versionSupposedBelow) > 0;
};
const versionIsBelow = (versionSupposedBelow, versionSupposedAbove) => {
  return versionCompare(versionSupposedBelow, versionSupposedAbove) < 0;
};
const versionIsBelowOrEqual = (versionSupposedBelow, versionSupposedAbove) => {
  return versionEqual(versionSupposedBelow, versionSupposedAbove) || versionIsBelow(versionSupposedBelow, versionSupposedAbove);
};
const versionHighest = (versionA, versionB) => {
  return versionIsAbove(versionA, versionB) ? versionA : versionB;
};
const versionLowest = (versionA, versionB) => {
  return versionIsBelow(versionA, versionB) ? versionA : versionB;
};

const getPlatformVersionForPlugin = (compatMap, pluginName, platformName) => {
  if (pluginName in compatMap === false) {
    throw new Error(`unknown plugin ${pluginName}`);
  }

  const pluginCompatMap = compatMap[pluginName];
  return platformName in pluginCompatMap ? pluginCompatMap[platformName] : "Infinity";
};
const platformToPluginNames = (compatMap, platformName, platformVersion) => {
  const pluginNames = Object.keys(compatMap);
  return pluginNames.filter(pluginName => {
    const platformVersionForPlugin = getPlatformVersionForPlugin(compatMap, pluginName, platformName);
    return versionIsBelow(platformVersion, platformVersionForPlugin);
  }).sort();
};

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

const compatMapToCompatMapWithModule = (compatMap, moduleFormat) => {
  // hardcode that nothing supports module for now
  // of course we would like to use
  // https://github.com/babel/babel/blob/090c364a90fe73d36a30707fc612ce037bdbbb24/packages/babel-preset-env/data/built-in-modules.json#L1
  // but let's force it for now
  // and once everything works fine we'll test how it behaves with native modules
  if (moduleFormat === "commonjs") {
    return _objectSpread({}, compatMap, {
      "transform-modules-commonjs": {}
    });
  }

  if (moduleFormat === "systemjs") {
    return _objectSpread({}, compatMap, {
      "transform-modules-systemjs": {}
    });
  }

  return compatMap;
};

const compatMapWithOnly = (compatMap, pluginNames) => {
  const compatMapSubset = {};
  pluginNames.forEach(pluginName => {
    compatMapSubset[pluginName] = compatMap[pluginName];
  });
  return compatMapSubset;
};

const pluginNameToPlugin = pluginName => availablePlugins[pluginName];

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
  moduleOutput = "commonjs",
  compatMap = compatMapBabel,
  pluginNames = Object.keys(compatMap)
}) => {
  compatMap = compatMapWithOnly(compatMap, pluginNames);
  compatMap = compatMapToCompatMapWithModule(compatMapBabel, moduleOutput);
  const pluginNamesForPlatform = platformToPluginNames(compatMap, platformName, platformVersion);
  const plugins = pluginNamesForPlatform.map(pluginName => pluginNameToPlugin(pluginName));

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
    return fileReadAsString(absoluteName).then(source => {
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
          return Promise.all([fileWriteFromString(buildLocation, code), fileWriteFromString(sourceMapLocation, JSON.stringify(map, null, "  "))]);
        }

        return fileWriteFromString(buildLocation, code);
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

exports.availablePlugins = availablePlugins;
exports.compatMapBabel = compatMapBabel;
exports.compileFileStructure = compileFileStructure;
exports.compatMapWithOnly = compatMapWithOnly;
exports.compatMapToCompatMapWithModule = compatMapToCompatMapWithModule;
exports.platformToPluginNames = platformToPluginNames;
exports.getPlatformVersionForPlugin = getPlatformVersionForPlugin;
exports.pluginNameToPlugin = pluginNameToPlugin;
exports.versionIsAbove = versionIsAbove;
exports.versionIsBelow = versionIsBelow;
exports.versionIsBelowOrEqual = versionIsBelowOrEqual;
exports.versionHighest = versionHighest;
exports.versionLowest = versionLowest;
exports.versionCompare = versionCompare;
exports.fileWriteFromString = fileWriteFromString;
//# sourceMappingURL=index.js.map
