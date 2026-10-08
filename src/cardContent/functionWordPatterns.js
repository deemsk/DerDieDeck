/**
 * Returns a compact pattern explanation for function-word Cloze cards.
 */
export function buildFunctionWordPatternHint(wordData = {}) {
  return wordData.patternHint || null;
}

/**
 * Returns the stable pattern family id for tags and metadata.
 */
export function getFunctionWordPatternFamily(wordData = {}) {
  return wordData.patternFamily || wordData.lexicalType || null;
}
