export const getCompatMapSubset = (compatMap, pluginNames) => {
  const compatMapSubset = {}
  pluginNames.forEach((pluginName) => {
    compatMapSubset[pluginName] = compatMap[pluginName]
  })
  return compatMapSubset
}
