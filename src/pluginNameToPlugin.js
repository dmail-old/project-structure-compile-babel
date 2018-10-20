import availablePlugins from "@babel/preset-env/lib/available-plugins.js"

export const isPluginNameCore = (pluginName) => pluginName in availablePlugins

export const pluginNameToPlugin = (pluginName) => availablePlugins[pluginName]
