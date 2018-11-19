import path from "path"
import { fileWriteFromString } from "./fileWriteFromString.js"

export const writeCompileResultInto = async (name, { code, map }, { localRoot, into }) => {
  const compiledName = `${into}/${name}`
  const compiledAbsoluteName = `${localRoot}/${compiledName}`

  if (map) {
    const sourceMapName = `${path.basename(name)}.map`
    const sourceMapLocationForSource = `${sourceMapName}`
    const folder = path.dirname(name)
    const sourceMapAbsoluteName = `${localRoot}/${into}/${
      folder ? `${folder}/` : "/"
    }${sourceMapName}`

    return Promise.all([
      fileWriteFromString(
        compiledAbsoluteName,
        `${code}
//# sourceMappingURL=${sourceMapLocationForSource}`,
      ),
      fileWriteFromString(sourceMapAbsoluteName, JSON.stringify(map, null, "  ")),
    ])
  }

  return fileWriteFromString(compiledAbsoluteName, code)
}
