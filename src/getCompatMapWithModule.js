export const getCompatMapWithModule = (compatMap, moduleFormat) => {
  // hardcode that nothing supports module for now
  // of course we would like to use
  // https://github.com/babel/babel/blob/090c364a90fe73d36a30707fc612ce037bdbbb24/packages/babel-preset-env/data/built-in-modules.json#L1
  // but let's force it for now
  // and once everything works fine we'll test how it behaves with native modules
  if (moduleFormat === "commonjs") {
    return {
      ...compatMap,
      ...{
        "transform-modules-commonjs": {},
      },
    }
  }
  if (moduleFormat === "systemjs") {
    return {
      ...compatMap,
      ...{
        "transform-modules-systemjs": {},
      },
    }
  }

  return compatMap
}
