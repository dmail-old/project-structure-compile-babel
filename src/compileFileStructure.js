import path from "path"
import { readProjectMetaMap, forEachRessourceMatching } from "@dmail/project-structure"
import { fileReadAsString } from "./fileReadAsString.js"
import { fileWriteFromString } from "./fileWriteFromString.js"

const { transformAsync } = require("@babel/core") // rollup fails if using import here

export const compileFileStructure = ({
  root,
  config = "structure.config.js",
  predicate = ({ compile }) => compile,
  into = "dist",
  plugins,
}) => {
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

  return readProjectMetaMap({ root, config }).then((metaMap) => {
    return forEachRessourceMatching(root, metaMap, predicate, compileAndWrite)
  })
}
