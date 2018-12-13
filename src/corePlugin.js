import { availablePlugins } from "./availablePlugins.js"

export const isPluginNameCore = (pluginName) => pluginName in availablePlugins

export const pluginNameToPlugin = (pluginName) => {
  if (isPluginNameCore(pluginName) === false) {
    throw new Error(`unknown plugin ${pluginName}`)
  }
  return availablePlugins[pluginName]
}

export const pluginOptionMapToPluginMap = (pluginOptionsMap = {}) => {
  const pluginMap = {}

  Object.keys(pluginOptionsMap).forEach((pluginName) => {
    pluginMap[pluginName] = [pluginNameToPlugin(pluginName), pluginOptionsMap[pluginName]]
  })

  return pluginMap
}
