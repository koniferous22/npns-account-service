// NOTE probably ugliest file that has ever seen the light of a day
// Purpose
// * @Directive decorators from type-graphql library don't work properly, because graphql schema is generated via AST, where directives don't work
// * in order to avoid writing SDL (which is btw required for apollo federation to work), here comes this file :D
// * Process is as follows (workaroud, which is used also in type-graphql apollo-federation)
// ! 1. Print generated schema into SDL
// ! 2. parse relevant parts of schema where apollo-federation field decorators are missing
// ! 3. replace parts of schema with missing directives (can't be done as part of AST)
// ! 4. create apollo-server instance from parsed SDL

import { printSchemaWithDirectives } from '@graphql-tools/utils';
import { InvalidValueError, SchemaFixParseError } from './exceptions';

type SanitizeDirectivesConfig = {
  objectTypeName: string;
  fieldDefinitionName?: string;
  directiveName: string;
  directiveArgs?: Record<string, string | string[] | number | boolean>;
};

const parseSchemaObjectTypes = (schema: string) => {
  // TODO generalize directiveArgName
  const wholeTypeRegex = /(?<wholeMatch>type (?<typename>\w+)(?<interfaces>\s*(?<interfaceImpl>implements\s*\w+)+)?(?<directives>\s*@(?<directiveName>\w+)(?<directiveArgs>\s*\(\s*(?<directiveArgName>fields): (?<directiveArg>"\w+")\s*\))?)*\s*\{(?<fields>\s*(?<field>\w+\s*(?<fieldArgs>\(\s*(?<fieldArg>\w+\s*:\s*(?<fieldArgType>\[?\w+!?\]?!?)\s*,\s*)*(?<lastFieldArg>\w+\s*:\s*(?<lastFieldArgType>\[?\w+!?\]?!?)\s*)\))?)\s*:\s*(?<payload>\[?\w+!?\]?!?)\s*)+\})/g;
  const fieldRegex = /(?<field>\w+\s*(?<fieldArgs>\(\s*(?<fieldArg>\w+\s*:\s*(?<fieldArgType>\[?\w+!?\]?!?)\s*,\s*)*(?<lastFieldArg>\w+\s*:\s*(?<lastFieldArgType>\[?\w+!?\]?!?)\s*)\))?)\s*:\s*(?<payload>\[?\w+!?\]?!?)/g;
  const headerRegex = /(?<header>type (?<typename>\w+)(?<interfaces>\s*(?<interfaceImpl>implements\s*\w+)+)?(?<directives>\s*@(?<directiveName>\w+)(?<directiveArgs>\s*\(\s*(?<directiveArgName>fields): (?<directiveArg>"\w+")\s*\))?)*)\s*\{/;
  // NOTE just copy paste of 1st regex

  const occurences = schema.match(wholeTypeRegex);
  if (!occurences) {
    throw new SchemaFixParseError(
      "Invalid generated schema: did't match object type regex"
    );
  }
  return occurences.map((wholeMatch) => {
    const headerResult = wholeMatch.match(headerRegex);
    if (!headerResult?.groups) {
      throw new SchemaFixParseError(
        "Invalid generated schema: didn't match header regex"
      );
    }
    const typename = headerResult.groups.typename;
    const header = headerResult.groups.header;
    const body = wholeMatch.substring(
      wholeMatch.indexOf('{') + 1,
      wholeMatch.indexOf('}')
    );
    const fields = body.match(fieldRegex);
    if (!fields) {
      throw new SchemaFixParseError(
        "Invalid generated schema: didn't match fields regex"
      );
    }
    return {
      typename,
      header,
      wholeMatch,
      fields
    };
  });
};

const printDirectiveArgValue = (
  val: NonNullable<SanitizeDirectivesConfig['directiveArgs']>[string]
) => {
  if (Array.isArray(val)) {
    return `"${val.join(' ')}"`;
  }
  switch (typeof val) {
    case 'boolean':
      return val ? 'True' : 'False';
    case 'number':
      return val.toString();
    case 'string':
      return `"${val}"`;
    default:
      throw new InvalidValueError('string | string[] | boolean | number', val);
  }
};

export const fixFieldSchemaDirectives = (
  schema: ReturnType<typeof printSchemaWithDirectives>,
  directivesConfig: SanitizeDirectivesConfig[]
) => {
  // eslint-disable-next-line prefer-const
  let resultSchema = schema;
  const parsedSchemaObjectTypes = parseSchemaObjectTypes(schema);
  parsedSchemaObjectTypes.forEach(
    ({ typename, header, wholeMatch, fields }) => {
      let newSchemaType = wholeMatch;
      let newHeader = header;
      const fieldTranslations = {} as Record<string, string>;
      directivesConfig
        .filter(({ objectTypeName }) => objectTypeName === typename)
        .forEach(({ fieldDefinitionName, directiveName, directiveArgs }) => {
          const appliedDirectiveArgs = Object.entries(directiveArgs ?? {})
            .map(
              ([key, argValue]) => `${key}: ${printDirectiveArgValue(argValue)}`
            )
            .join(', ');
          const appliedDirective = `@${directiveName}${
            appliedDirectiveArgs && `(${appliedDirectiveArgs})`
          }`;
          if (fieldDefinitionName) {
            const wholeTranslatedField = fields.find((field) =>
              field.startsWith(fieldDefinitionName)
            );
            if (!wholeTranslatedField) {
              throw new SchemaFixParseError(
                `Unable to find schema field "${fieldDefinitionName}"`
              );
            }
            fieldTranslations[wholeTranslatedField] = `${
              fieldTranslations[wholeTranslatedField] ?? wholeTranslatedField
            } ${appliedDirective}`;
          } else {
            newHeader = `${newHeader} ${appliedDirective}`;
          }
        });
      newSchemaType = newSchemaType.replace(header, newHeader);
      Object.entries(fieldTranslations).forEach(([from, to]) => {
        newSchemaType = newSchemaType.replace(from, to);
      });
      resultSchema = resultSchema.replace(wholeMatch, newSchemaType);
    }
  );
  return resultSchema;
};
