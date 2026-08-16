export function strictObject(properties, required = Object.keys(properties)) {
  return {
    type: 'object',
    properties,
    required,
    additionalProperties: false,
  };
}

export function jsonSchemaResponse(name, schema) {
  return {
    type: 'json_schema',
    json_schema: {
      name,
      strict: true,
      schema,
    },
  };
}

export const nullableStringSchema = { type: ['string', 'null'] };

export const imageBriefSchema = strictObject({
  searchQuery: nullableStringSchema,
  queryVariants: { type: 'array', items: { type: 'string' } },
  sceneSummary: nullableStringSchema,
  focusRole: nullableStringSchema,
  mustShow: { type: 'array', items: { type: 'string' } },
  avoid: { type: 'array', items: { type: 'string' } },
  imagePrompt: nullableStringSchema,
});

export const optionalImageBriefSchema = {
  anyOf: [imageBriefSchema, { type: 'null' }],
};

export const lexicalMeaningSchema = strictObject({
  russian: { type: 'string' },
  english: { type: 'string' },
  imageSearchTerms: { type: 'array', items: { type: 'string' } },
});

export const exampleSentenceSchema = strictObject({
  german: { type: 'string' },
  russian: { type: 'string' },
  focusForm: { type: 'string' },
  imageBrief: optionalImageBriefSchema,
});

export const verbExampleSentenceSchema = strictObject({
  german: { type: 'string' },
  russian: { type: 'string' },
  focusForm: { type: 'string' },
});

export const verbFormSentenceSchema = strictObject({
  german: { type: 'string' },
  russian: { type: 'string' },
  focusForm: { type: 'string' },
  formRussian: { type: 'string' },
});

export const suggestionSchema = strictObject({
  text: { type: 'string' },
  reason: nullableStringSchema,
});
