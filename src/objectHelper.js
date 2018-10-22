export const objectValues = (object) => {
  return Object.keys(object).map((key) => object[key])
}

export const objectFilter = (object, callback) => {
  const filtered = {}

  Object.keys(object).forEach((key) => {
    const value = object[key]
    if (callback(key, value, object)) {
      filtered[key] = value
    }
  })

  return filtered
}
