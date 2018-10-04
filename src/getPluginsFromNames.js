import availablePlugins from "@babel/preset-env/lib/available-plugins.js"

export const getPluginsFromNames = (pluginNames) =>
  pluginNames.map((name) => availablePlugins[name])
