import { fileReadAsString } from "./fileReadAsString.js"

const { transformAsync } = require("@babel/core") // rollup fails if using import here

export const compileFile = async (name, { localRoot, plugins }) => {
  const absoluteName = `${localRoot}/${name}`

  const source = await fileReadAsString(absoluteName)
  const { code, map } = await transformAsync(source, {
    plugins,
    filenameRelative: name,
    filename: absoluteName,
    sourceMaps: true,
    sourceFileName: name,
  })

  return { code, map }
}
