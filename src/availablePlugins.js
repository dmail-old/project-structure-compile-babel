/* eslint-disable import/max-dependencies */
import proposalAsyncGeneratorFunctions from "@babel/plugin-proposal-async-generator-functions"
import proposalJSONStrings from "@babel/plugin-proposal-json-strings"
import proposalObjectRestSpread from "@babel/plugin-proposal-object-rest-spread"
import proposalOptionalCatchBinding from "@babel/plugin-proposal-optional-catch-binding"
import proposalUnicodePropertyRegex from "@babel/plugin-proposal-unicode-property-regex"
import syntaxAsyncGenerator from "@babel/plugin-syntax-async-generators"
import syntaxDynamicImport from "@babel/plugin-syntax-dynamic-import"
import syntaxObjectRestSpread from "@babel/plugin-syntax-object-rest-spread"
import syntaxOptionalCatchBinding from "@babel/plugin-syntax-optional-catch-binding"
import transformAsyncToGenerator from "@babel/plugin-transform-async-to-generator"
import transformArrowFunction from "@babel/plugin-transform-arrow-functions"
import transformBlockScopedFunctions from "@babel/plugin-transform-block-scoped-functions"
import transformBlockScoping from "@babel/plugin-transform-block-scoping"
import transformClasses from "@babel/plugin-transform-classes"
import transformComputedProperties from "@babel/plugin-transform-computed-properties"
import transformDestructuring from "@babel/plugin-transform-destructuring"
import transformDotAllRegex from "@babel/plugin-transform-dotall-regex"
import transformDuplicateKeys from "@babel/plugin-transform-duplicate-keys"
import transformExponentiationOperator from "@babel/plugin-transform-exponentiation-operator"
import transformForOf from "@babel/plugin-transform-for-of"
import transformFunctionName from "@babel/plugin-transform-function-name"
import transformLiterals from "@babel/plugin-transform-literals"
import transformModulesAMD from "@babel/plugin-transform-modules-amd"
import transformModulesCommonJS from "@babel/plugin-transform-modules-commonjs"
import transformModulesSystemJS from "@babel/plugin-transform-modules-systemjs"
import transformModulesUMD from "@babel/plugin-transform-modules-umd"
import transformNewTarget from "@babel/plugin-transform-new-target"
import transformObjectSuper from "@babel/plugin-transform-object-super"
import transformParameters from "@babel/plugin-transform-parameters"
import transformRegenerator from "@babel/plugin-transform-regenerator"
import transformShorthandProperties from "@babel/plugin-transform-shorthand-properties"
import transformSpread from "@babel/plugin-transform-spread"
import transformStickyRegex from "@babel/plugin-transform-sticky-regex"
import transformTemplateLiterals from "@babel/plugin-transform-template-literals"
import transformTypeOfSymbol from "@babel/plugin-transform-typeof-symbol"
import transformUnicodeRegex from "@babel/plugin-transform-unicode-regex"

export const availablePlugins = {
  "proposal-async-generator-functions": proposalAsyncGeneratorFunctions,
  "proposal-object-rest-spread": proposalObjectRestSpread,
  "proposal-optional-catch-binding": proposalOptionalCatchBinding,
  "proposal-unicode-property-regex": proposalUnicodePropertyRegex,
  "proposal-json-strings": proposalJSONStrings,
  "syntax-async-generators": syntaxAsyncGenerator,
  "syntax-dynamic-import": syntaxDynamicImport,
  "syntax-object-rest-spread": syntaxObjectRestSpread,
  "syntax-optional-catch-binding": syntaxOptionalCatchBinding,
  "transform-async-to-generator": transformAsyncToGenerator,
  "transform-arrow-functions": transformArrowFunction,
  "transform-block-scoped-functions": transformBlockScopedFunctions,
  "transform-block-scoping": transformBlockScoping,
  "transform-classes": transformClasses,
  "transform-computed-properties": transformComputedProperties,
  "transform-destructuring": transformDestructuring,
  "transform-dotall-regex": transformDotAllRegex,
  "transform-duplicate-keys": transformDuplicateKeys,
  "transform-exponentiation-operator": transformExponentiationOperator,
  "transform-for-of": transformForOf,
  "transform-function-name": transformFunctionName,
  "transform-literals": transformLiterals,
  "transform-modules-amd": transformModulesAMD,
  "transform-modules-commonjs": transformModulesCommonJS,
  "transform-modules-systemjs": transformModulesSystemJS,
  "transform-modules-umd": transformModulesUMD,
  "transform-new-target": transformNewTarget,
  "transform-object-super": transformObjectSuper,
  "transform-parameters": transformParameters,
  "transform-regenerator": transformRegenerator,
  "transform-shorthand-properties": transformShorthandProperties,
  "transform-spread": transformSpread,
  "transform-sticky-regex": transformStickyRegex,
  "transform-template-literals": transformTemplateLiterals,
  "transform-typeof-symbol": transformTypeOfSymbol,
  "transform-unicode-regex": transformUnicodeRegex,
}
