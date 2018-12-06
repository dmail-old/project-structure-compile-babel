import path from "path"
import { fileWriteFromString } from "./fileWriteFromString.js"

const appendSourceMappingURL = (code, sourceMappingURL) => {
  return `${code}
//# ${"sourceMappingURL"}=${sourceMappingURL}`
}

export const fileSystemWriteCompileResult = async (
  { code, map },
  { localRoot, outputFile, outputFolder },
) => {
  if (typeof outputFolder !== "string") {
    throw new TypeError(`outputFolder must be a string, got ${outputFolder}`)
  }
  if (outputFolder.length === 0) {
    throw new Error(`outputFolder must not be an empty string`)
  }

  if (map) {
    const sourceMapName = `${path.basename(outputFile)}.map`
    const sourceMapLocationForSource = `./${sourceMapName}`

    const sourceMapFile =
      outputFile.indexOf("/") < 1 ? sourceMapName : `${path.dirname(outputFile)}/${sourceMapName}`
    const sourceLocationForSourceMap = `${path.relative(
      `${localRoot}/${outputFolder}/${outputFile}`,
      `${localRoot}/${outputFile}`,
    )}`.slice("../".length)
    map.sources = [sourceLocationForSourceMap]
    delete map.sourcesContent

    return Promise.all([
      fileWriteFromString(
        `${localRoot}/${outputFolder}/${outputFile}`,
        appendSourceMappingURL(code, sourceMapLocationForSource),
      ),
      fileWriteFromString(
        `${localRoot}/${outputFolder}/${sourceMapFile}`,
        JSON.stringify(map, null, "  "),
      ),
    ])
  }

  return fileWriteFromString(`${localRoot}/${outputFolder}/${outputFile}`, code)
}
