import 'reflect-metadata';
import { buildFederatedSchema } from '@apollo/federation';
import { ApolloServer } from 'apollo-server';
import { printSchema } from 'graphql';
import gql from 'graphql-tag';
import { buildSchema, createResolversMap } from 'type-graphql';
import { createConnection } from 'typeorm';
import { UserResolver } from './resolvers/User';
import { AccountServiceContext } from './context';

const bootstrap = async () => {
  // TODO unify config
  const port = parseInt(process.env.PORT ?? '', 10);
  if (Number.isNaN(port)) {
    throw new Error(
      `Invalid port from config 'ACCOUNT_SERVICE_PORT': ${process.env.ACCOUNT_SERVICE_PORT}`
    );
  }
  const connection = await createConnection();
  const typeGraphQLSchema = await buildSchema({
    resolvers: [UserResolver]
  });
  const schema = buildFederatedSchema({
    typeDefs: gql(printSchema(typeGraphQLSchema)),
    resolvers: createResolversMap(typeGraphQLSchema) as any
  });
  const server = new ApolloServer({
    schema,
    context: {
      em: connection.createEntityManager()
    } as AccountServiceContext
  });
  server.listen({ port }).then(({ url }) => {
    console.log(`🚀 Account service ready at ${url}`);
  });
};

bootstrap();
