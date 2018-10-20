import path from "path"
import { createFileStructure } from "@dmail/project-structure"
import { fileReadAsString } from "./fileReadAsString.js"
import { fileWriteFromString } from "./fileWriteFromString.js"
import { platformToPluginNames } from "./platformToPluginNames.js"
import { compatMapBabel } from "./compatMapBabel.js"
import { compatMapWithOnly } from "./compatMapWithOnly.js"

const { transformAsync } = require("@babel/core") // rollup fails if using import here

export const compileFileStructure = ({
  root,
  config = "structure.config.js",
  predicate = ({ compile }) => compile,
  into = "dist",
  platformName = "node",
  platformVersion = "8.0",
  compatMap = compatMapBabel,
  pluginMap,
}) => {
  const pluginNames = Object.keys(pluginMap)
  compatMap = compatMapWithOnly(compatMap, pluginNames)

  const pluginNamesForPlatform = platformToPluginNames(compatMap, platformName, platformVersion)
  const plugins = pluginNamesForPlatform.map((pluginName) => pluginMap[pluginName])

  const transpile = ({ code, filename, sourceFileName }) => {
    return transformAsync(code, {
      plugins,
      filename,
      sourceMaps: true,
      sourceFileName,
    })
  }

  const compileAndWrite = ({ absoluteName, relativeName }) => {
    return fileReadAsString(absoluteName).then((source) => {
      const buildRelativeName = `${into}/${relativeName}`
      const buildLocation = `${root}/${buildRelativeName}`
      const sourceMapName = `${path.basename(relativeName)}.map`
      const sourceMapLocationForSource = `${sourceMapName}`
      const sourceMapLocation = `${root}/${into}/${relativeName}.map`
      const sourceNameForSourceMap = path.relative(path.dirname(sourceMapLocation), absoluteName)

      return transpile({
        code: source,
        filename: absoluteName,
        sourceFileName: sourceNameForSourceMap,
      })
        .then(({ code, map }) => {
          if (map) {
            code = `${code}
//# sourceMappingURL=${sourceMapLocationForSource}`
            return Promise.all([
              fileWriteFromString(buildLocation, code),
              fileWriteFromString(sourceMapLocation, JSON.stringify(map, null, "  ")),
            ])
          }

          return fileWriteFromString(buildLocation, code)
        })
        .then(() => {
          console.log(`${relativeName} -> ${buildRelativeName} `)
        })
    })
  }

  return createFileStructure({ root, config }).then(({ forEachFileMatching }) => {
    return forEachFileMatching(predicate, compileAndWrite)
  })
}
