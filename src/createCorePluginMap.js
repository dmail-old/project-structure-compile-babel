import { pluginNameToPlugin, isPluginNameCore } from "./pluginNameToPlugin.js"

export const createCorePluginMap = (corePluginOptionMap) => {
  const pluginMap = {}

  Object.keys(corePluginOptionMap).forEach((pluginName) => {
    if (isPluginNameCore(pluginName) === false) {
      throw new Error(`${pluginName} is not a core plugin`)
    }
    pluginMap[pluginName] = [pluginNameToPlugin(pluginName), corePluginOptionMap[pluginName]]
  })

  return pluginMap
}
