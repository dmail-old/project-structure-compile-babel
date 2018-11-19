import path from "path"

import { fileReadAsString } from "./fileReadAsString.js"
import { fileWriteFromString } from "./fileWriteFromString.js"

const { transformAsync } = require("@babel/core") // rollup fails if using import here

export const compileFileInto = async (name, { root, into, plugins }) => {
  const absoluteName = `${root}/${name}`
  const compiledName = `${into}/${name}`
  const compiledAbsoluteName = `${root}/${compiledName}`
  const sourceMapName = `${path.basename(name)}.map`
  const sourceMapLocationForSource = `${sourceMapName}`
  const sourceMapAbsoluteName = `${root}/${into}/${name}.map`
  const sourceNameForSourceMap = path.relative(path.dirname(sourceMapAbsoluteName), absoluteName)

  const source = await fileReadAsString(absoluteName)
  const { code, map } = await transformAsync(source, {
    plugins,
    filename: absoluteName,
    sourceMaps: true,
    sourceFileName: sourceNameForSourceMap,
  })

  if (map) {
    await Promise.all([
      fileWriteFromString(
        compiledAbsoluteName,
        `${code}
//# sourceMappingURL=${sourceMapLocationForSource}`,
      ),
      fileWriteFromString(sourceMapAbsoluteName, JSON.stringify(map, null, "  ")),
    ])
  } else {
    await fileWriteFromString(compiledAbsoluteName, code)
  }

  console.log(`${name} -> ${compiledName} `)
}
