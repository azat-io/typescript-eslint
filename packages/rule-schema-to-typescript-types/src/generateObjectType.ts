import type { JSONSchema4ObjectSchema } from '@typescript-eslint/utils/json-schema';

import { requiresQuoting } from '@typescript-eslint/type-utils';
import { TSUtils } from '@typescript-eslint/utils';

import type { AST, ObjectAST, RefMap } from './types';

import { generateType } from './generateType';
import { getCommentLines } from './getCommentLines';

export function generateObjectType(
  schema: JSONSchema4ObjectSchema,
  refMap: RefMap,
): ObjectAST {
  const commentLines = getCommentLines(schema);

  let indexSignature: AST | null = null;
  if (
    schema.additionalProperties === true ||
    // eslint-disable-next-line @typescript-eslint/internal/eqeq-nullish
    schema.additionalProperties === undefined
  ) {
    indexSignature = {
      commentLines: [],
      type: 'type-reference',
      typeName: 'unknown',
    };
  } else if (typeof schema.additionalProperties === 'object') {
    const indexSigType = generateType(schema.additionalProperties, refMap);
    indexSignature = indexSigType;
  }

  const properties: ObjectAST['properties'] = [];
  const required = new Set(
    TSUtils.isArray(schema.required) ? schema.required : [],
  );
  if (schema.properties) {
    const propertyDefs = Object.entries(schema.properties);
    for (const [propName, propSchema] of propertyDefs) {
      const propType = generateType(propSchema, refMap);
      const sanitisedPropName = requiresQuoting(propName)
        ? `'${propName}'`
        : propName;
      properties.push({
        name: sanitisedPropName,
        optional: !required.has(propName),
        type: propType,
      });
    }
  }

  return {
    commentLines,
    indexSignature,
    properties,
    type: 'object',
  };
}
