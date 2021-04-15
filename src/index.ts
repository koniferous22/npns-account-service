import 'reflect-metadata';
import { buildFederatedSchema } from '@apollo/federation';
import { ApolloServer } from 'apollo-server';
import { addResolversToSchema } from 'apollo-graphql';
import gql from 'graphql-tag';
import { buildSchema, createResolversMap } from 'type-graphql';
import { createConnection } from 'typeorm';
import { printSchemaWithDirectives } from '@graphql-tools/utils';
import { specifiedDirectives } from 'graphql';
// eslint-disable-next-line import/no-named-as-default
import federationDirectives from '@apollo/federation/dist/directives';
import { UserResolver } from './resolvers/User';
import { AccountServiceContext } from './context';
import { Config } from './config';
import { authChecker } from './authChecker';
import { Nodemailer } from './external/nodemailer';
import { TokenCacheService } from './external/token-cache';
import { resolveUserReference } from './references/User';
import { fixFieldSchemaDirectives } from './utils/fixFieldDirectives';
import { WalletResolver } from './resolvers/Wallet';
import { ActivityResolver } from './resolvers/Activity';
import { TransactionResolver } from './resolvers/Transaction';

const federationFieldDirectivesFixes: Parameters<
  typeof fixFieldSchemaDirectives
>[1] = [];

const bootstrap = async () => {
  const { port, graphqlPath } = Config.getInstance().getConfig();
  const connection = await createConnection();
  const typeGraphQLSchema = await buildSchema({
    resolvers: [
      UserResolver,
      WalletResolver,
      ActivityResolver,
      TransactionResolver
    ],
    directives: [...specifiedDirectives, ...federationDirectives],
    authChecker
  });

  const schema = buildFederatedSchema({
    typeDefs: gql(
      fixFieldSchemaDirectives(
        printSchemaWithDirectives(typeGraphQLSchema),
        federationFieldDirectivesFixes
      )
    ),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolvers: createResolversMap(typeGraphQLSchema) as any
  });

  addResolversToSchema(schema, {
    User: {
      __resolveReference: resolveUserReference
    }
  });
  const nodemailer = new Nodemailer();
  const tokenCache = new TokenCacheService();
  const server = new ApolloServer({
    schema,
    context: ({ req }) => {
      const userFromRequest = req.headers.user as string;
      return {
        em: connection.createEntityManager(),
        nodemailer,
        tokenCache,
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
