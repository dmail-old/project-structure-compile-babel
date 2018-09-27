// using this: https://github.com/faisalman/ua-parser-js
// + require("@babel/preset-env/data/plugins.json")
// we could know the required plugins
// we could also get the list of feature from a given user agent string
// and decide which group the user agent belongs to
// we could create X groups
// these groups would contains any given combination of plugins
// and a browser would get this set of plugins
// instead of the exact set it needs

const presetEnv = require("@babel/preset-env") // rollup fails if using import here

const getPlugins = (options) => {
  // preset env is not really meant to be used outside of the script
  // I'm calling it manually so I have to fake some stuff
  // https://github.com/babel/babel/blob/f38be131137c0935366124ca34c4a9920fd036fa/packages/babel-preset-env/src/index.js#L162
  const api = { assertVersion: () => {} }
  return presetEnv.default(api, options)
}

export const getBabelPluginsFor = ({
  platformName = "node",
  // https://github.com/babel/babel/issues/7277
  platformVersion = "8.0",
  moduleOutput = "commonjs", // "systemjs" for dev-server
}) => {
  // https://babeljs.io/docs/en/next/babel-preset-env.html
  const { plugins } = getPlugins({
    useBuiltIns: false,
    targets: {
      [platformName]: platformVersion,
    },
    modules: moduleOutput,
    debug: false,
    ignoreBrowserslistConfig: true,
  })

  return plugins
}
