import path from "path"
import { createFileStructure } from "@dmail/project-structure"
import { getFileContentAsString } from "./getFileContentAsString.js"
import { writeFileFromString } from "./writeFileFromString.js"
import { getPluginNamesForPlatform } from "./getPluginNamesForPlatform.js"
import { getPluginsFromNames } from "./getPluginsFromNames.js"
import { compatMapBabel } from "./compatMapBabel.js"
import { getCompatMapWithModule } from "./getCompatMapWithModule.js"
import { getCompatMapSubset } from "./getCompatMapSubset.js"

const { transformAsync } = require("@babel/core") // rollup fails if using import here

export const compileFileStructure = ({
  root,
  config = "structure.config.js",
  predicate = ({ compile }) => compile,
  into = "dist",
  platformName = "node",
  platformVersion = "8.0",
  moduleOutput = "commonjs",
  compatMap = compatMapBabel,
  pluginNames = Object.keys(compatMap),
}) => {
  compatMap = getCompatMapWithModule(compatMapBabel, moduleOutput)
  compatMap = getCompatMapSubset(compatMap, pluginNames)

  const pluginNamesForPlatform = getPluginNamesForPlatform(compatMap, platformName, platformVersion)
  const plugins = getPluginsFromNames(pluginNamesForPlatform)

  const transpile = ({ code, filename, sourceFileName }) => {
    return transformAsync(code, {
      plugins,
      filename,
      sourceMaps: true,
      sourceFileName,
    })
  }

  const compileAndWrite = ({ absoluteName, relativeName }) => {
    return getFileContentAsString(absoluteName).then((source) => {
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
              writeFileFromString(buildLocation, code),
              writeFileFromString(sourceMapLocation, JSON.stringify(map, null, "  ")),
            ])
          }

          return writeFileFromString(buildLocation, code)
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
