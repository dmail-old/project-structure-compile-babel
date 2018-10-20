export const compatMapWithOnly = (compatMap, pluginNames) => {
  const compatMapSubset = {}

  pluginNames.forEach((pluginName) => {
    compatMapSubset[pluginName] = pluginName in compatMap ? compatMap[pluginName] : {}
  })

  return compatMapSubset
}
