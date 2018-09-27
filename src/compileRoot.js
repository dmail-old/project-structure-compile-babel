import path from "path"
import { createRoot } from "@dmail/project-structure"
import { getFileContentAsString } from "./getFileContentAsString.js"
import { writeFileFromString } from "./writeFileFromString.js"
import { createGetGroupForPlatform } from "./createGetGroup/createGetGroupForPlatform.js"

const { transformAsync } = require("@babel/core") // rollup fails if using import here

const metaPredicate = ({ compile }) => compile

export const compileRoot = ({
  root,
  into = "dist",
  platformName = "node",
  platformVersion = "8.0",
  moduleOutput = "commonjs",
}) => {
  const { getGroupForPlatform } = createGetGroupForPlatform({
    moduleOutput,
  })

  const { plugins } = getGroupForPlatform({
    platformName,
    platformVersion,
  })

  const transpile = ({ code, filename, sourceFileName }) => {
    return transformAsync(code, {
      plugins,
      filename,
      sourceMaps: true,
      sourceFileName,
    })
  }

  return createRoot({ root }).then(({ forEachFileMatching }) => {
    return forEachFileMatching(metaPredicate, ({ absoluteName, relativeName }) => {
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
    })
  })
}
