import path from "path"
import { fileWriteFromString } from "./fileWriteFromString.js"

export const fileSystemWriteCompileResult = async (
  { code, map },
  outputFile,
  outputFolder,
  sourceLocationForSourceMap = `/${outputFile}`,
) => {
  if (typeof outputFolder !== "string") {
    throw new TypeError(`outputFolder must be a string, got ${outputFolder}`)
  }
  if (outputFolder.length === 0) {
    throw new Error(`outputFolder must not be an empty string`)
  }

  if (map) {
    const sourceMapName = `${path.basename(outputFile)}.map`
    const sourceMapFile =
      outputFile.indexOf("/") < 1 ? sourceMapName : `${path.dirname(outputFile)}/${sourceMapName}`

    if (sourceLocationForSourceMap === undefined) {
      sourceLocationForSourceMap = `/${outputFile}`
      map.sources = [sourceLocationForSourceMap]
      delete map.sourcesContent

      const sourceMapLocationForSource = sourceMapName
      code = `${code}
//# sourceMappingURL=${sourceMapLocationForSource}`
    } else {
      map.sources = [sourceLocationForSourceMap]
      delete map.sourcesContent

      const sourceMapLocationForSource = `${outputFolder}/${sourceMapFile}`
      code = `${code}
//# sourceMappingURL=${sourceMapLocationForSource}`
    }

    return Promise.all([
      fileWriteFromString(`${outputFolder}/${outputFile}`, code),
      fileWriteFromString(`${outputFolder}/${sourceMapFile}`, JSON.stringify(map, null, "  ")),
    ])
  }

  return fileWriteFromString(`${outputFolder}/${outputFile}`, code)
}
