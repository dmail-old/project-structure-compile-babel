import path from "path"
import { fileWriteFromString } from "./fileWriteFromString.js"

export const fileSystemWriteCompileResult = async ({ code, map }, outputFile, outputFolder) => {
  if (typeof outputFolder !== "string") {
    throw new TypeError(`outputFolder must be a string, got ${outputFolder}`)
  }
  if (outputFolder.length === 0) {
    throw new Error(`outputFolder must not be an empty string`)
  }

  if (map) {
    const sourceMapName = `${path.basename(outputFile)}.map`
    const sourceMapFile =
      outputFile.indexOf("/") === -1
        ? sourceMapName
        : `${path.dirname(outputFile)}/${sourceMapName}`
    const sourceMapLocationForSource = sourceMapName
    map.sources = [`/${outputFile}`]
    delete map.sourcesContent

    return Promise.all([
      fileWriteFromString(
        `${outputFolder}/${outputFile}`,
        `${code}
//# sourceMappingURL=${sourceMapLocationForSource}`,
      ),
      fileWriteFromString(`${outputFolder}/${sourceMapFile}`, JSON.stringify(map, null, "  ")),
    ])
  }

  return fileWriteFromString(`${outputFolder}/${outputFile}`, code)
}
