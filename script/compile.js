const { rollup } = require("rollup")
const babel = require("rollup-plugin-babel")
const { localRoot } = require("./util.js")

const plugins = ["@babel/plugin-proposal-object-rest-spread", "@babel/plugin-transform-spread"]
const inputFile = `${localRoot}/index.js`
const outputFile = `${localRoot}/dist/index.js`

const compile = async () => {
  const bundle = await rollup({
    input: inputFile,
    plugins: [
      babel({
        babelrc: false,
        exclude: "node_modules/**",
        plugins,
      }),
    ],
  })

  await bundle.write({
    format: "cjs",
    file: outputFile,
    sourcemap: true,
  })

  console.log(`index.js -> dist/index.js`)
}
compile()
