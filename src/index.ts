import 'reflect-metadata';
import { buildFederatedSchema } from '@apollo/federation';
import { ApolloServer } from 'apollo-server';
import gql from 'graphql-tag';
import { buildSchema, createResolversMap } from 'type-graphql';
import { createConnection } from 'typeorm';
import { printSchemaWithDirectives } from '@graphql-tools/utils';
import { UserResolver } from './resolvers/User';
import { AccountServiceContext } from './context';
import { Config } from './config';
import { authChecker } from './authChecker';
import { Nodemailer } from './external/nodemailer';
import { TokenCacheService } from './external/token-cache';

const bootstrap = async () => {
  const { port, graphqlPath } = Config.getInstance().getConfig();
  const connection = await createConnection();
  const typeGraphQLSchema = await buildSchema({
    resolvers: [UserResolver],
    authChecker
  });

  const schema = buildFederatedSchema({
    typeDefs: gql(printSchemaWithDirectives(typeGraphQLSchema)),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolvers: createResolversMap(typeGraphQLSchema) as any
  });
  const server = new ApolloServer({
    schema,
    context: ({ req }) => {
      const userFromRequest = req.headers.user as string;
      return {
        em: connection.createEntityManager(),
        nodemailer: new Nodemailer(),
        tokenCache: new TokenCacheService(),
        user: userFromRequest ? JSON.parse(userFromRequest) : null,
        config: Config.getInstance()
      } as AccountServiceContext;
    }
  });
  server.setGraphQLPath(graphqlPath);
  server.listen({ port }).then(({ url }) => {
    console.log(`🚀 Account service ready at ${url}`);
  });
};

bootstrap();
