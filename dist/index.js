'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var fs = _interopDefault(require('fs'));
var path = _interopDefault(require('path'));

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

const presetEnv = require("@babel/preset-env"); // rollup fails if using import here


const getPlugins = options => {
  // preset env is not really meant to be used outside of the script
  // I'm calling it manually so I have to fake some stuff
  // https://github.com/babel/babel/blob/f38be131137c0935366124ca34c4a9920fd036fa/packages/babel-preset-env/src/index.js#L162
  const api = {
    assertVersion: () => {}
  };
  return presetEnv.default(api, options);
};

const getBabelPluginsFor = ({
  platformName = "node",
  // https://github.com/babel/babel/issues/7277
  platformVersion = "8.0",
  moduleOutput = "commonjs" // "systemjs" for dev-server

}) => {
  // https://babeljs.io/docs/en/next/babel-preset-env.html
  const {
    plugins
  } = getPlugins({
    useBuiltIns: false,
    targets: {
      [platformName]: platformVersion
    },
    modules: moduleOutput,
    debug: false,
    ignoreBrowserslistConfig: true
  });
  return plugins;
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
  const plugins = getBabelPluginsFor({
    platformName,
    platformVersion,
    moduleOutput
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
exports.getBabelPluginsFor = getBabelPluginsFor;
exports.compileRoot = compileRoot;
//# sourceMappingURL=index.js.map
