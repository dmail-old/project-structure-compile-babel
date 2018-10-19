import availablePlugins from "@babel/preset-env/lib/available-plugins.js"

export { availablePlugins }

export const pluginNameToPlugin = (pluginName) => availablePlugins[pluginName]
