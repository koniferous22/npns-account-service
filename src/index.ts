import 'reflect-metadata';
import { buildFederatedSchema } from '@apollo/federation';
import { ApolloServer, SchemaDirectiveVisitor } from 'apollo-server';
import { DirectiveDefinitionNode, GraphQLDirective, print } from 'graphql';
import gql from 'graphql-tag';
import { buildSchema, createResolversMap } from 'type-graphql';
import { createConnection } from 'typeorm';
import { Tedis } from 'tedis';
import { printSchemaWithDirectives } from '@graphql-tools/utils';
import { UserResolver } from './resolvers/User';
import { AccountServiceContext } from './context';
import { getConfig } from './config';
import { Await } from './utils/generics';
// import { LoggerDirective } from './directives/logger';
import { AuthDirective } from './directives/auth';

// NOTE workaround, bc typegraphql doesn't work properly
const printWithFixedDirectives = (
  schema: Await<ReturnType<typeof buildSchema>>,
  directives: Array<DirectiveDefinitionNode>
) => {
  const originalSchema = printSchemaWithDirectives(schema);
  return `
${directives.map(print).join('\n')}
${originalSchema}
`;
};

const bootstrap = async () => {
  const { port, graphqlPath, verificationToken } = getConfig();
  const connection = await createConnection();
  const directives = [
    {
      name: 'auth',
      locations: ['OBJECT' as const, 'FIELD_DEFINITION' as const]
    }
  ];
  const typeGraphQLSchema = await buildSchema({
    resolvers: [UserResolver],
    directives: directives.map((opts) => new GraphQLDirective(opts))
  });

  const schema = buildFederatedSchema({
    typeDefs: gql(
      printWithFixedDirectives(
        typeGraphQLSchema,
        directives.map((directive) => ({
          kind: 'DirectiveDefinition',
          name: {
            kind: 'Name',
            value: directive.name
          },
          repeatable: false,
          locations: directive.locations.map((location) => ({
            kind: 'Name',
            value: location
          }))
        }))
      )
    ),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolvers: createResolversMap(typeGraphQLSchema) as any
  });
  SchemaDirectiveVisitor.visitSchemaDirectives(schema, {
    auth: AuthDirective
  });
  const server = new ApolloServer({
    schema,
    context: ({ req }) => {
      const userFromRequest = req.headers.user as string;
      return {
        em: connection.createEntityManager(),
        verificationTokenCache: new Tedis(verificationToken.cache),
        user: userFromRequest ? JSON.parse(userFromRequest) : null,
        config: getConfig()
      } as AccountServiceContext;
    }
  });
  server.setGraphQLPath(graphqlPath);
  server.listen({ port }).then(({ url }) => {
    console.log(`🚀 Account service ready at ${url}`);
  });
};

bootstrap();
