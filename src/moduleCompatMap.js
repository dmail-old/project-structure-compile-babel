// copied from @babel/preset-env/data/built-in-modules.json.
// Because this is an hidden implementation detail of @babel/preset-env
// it could be deprecated or moved anytime.
// For that reason it makes more sens to have it inlined here
// than importing it from an undocumented location.
// Ideally it would be documented or a separate module

export const moduleCompatMap = {
  edge: "16",
  firefox: "60",
  chrome: "61",
  safari: "10.1",
  opera: "48",
  ios_saf: "10.3", // eslint-disable-line camelcase
  and_ff: "60", // eslint-disable-line camelcase
}
