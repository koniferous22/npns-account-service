import { SchemaDirectiveVisitor } from 'apollo-server';
import jwt from 'jsonwebtoken';
import { defaultFieldResolver, GraphQLField, GraphQLObjectType } from 'graphql';
import { AccountServiceContext } from '../context';
import { getConfig } from '../config';

// NOTE inspiration behind this directive
// * https://www.apollographql.com/docs/apollo-server/schema/creating-directives/
// * https://www.apollographql.com/blog/setting-up-authentication-and-authorization-with-apollo-federation/

// TODO consider interface merging as soon as problems are encountered
type DecoratedGraphQLField<
  TSource = any,
  TContext = any,
  TArgs = any
> = GraphQLField<TSource, TContext, TArgs> & {
  _requiredAuthRole: boolean;
};

type DecoratedGraphQLObjectType = GraphQLObjectType<
  any,
  AccountServiceContext
> & {
  _requiredAuthRole: boolean;
  _authFieldsWrapped: boolean;
};

export class AuthDirective extends SchemaDirectiveVisitor {
  visitObject(type: DecoratedGraphQLObjectType) {
    this.ensureFieldsWrapped(type);
    type._requiredAuthRole = this.args.requires;
  }
  // Visitor methods for nested types like fields and arguments
  // also receive a details object that provides information about
  // the parent and grandparent types.
  visitFieldDefinition(
    field: DecoratedGraphQLField<any, AccountServiceContext>,
    details: any
  ) {
    this.ensureFieldsWrapped(details.objectType);
    field._requiredAuthRole = this.args.requires;
  }

  ensureFieldsWrapped(objectType: DecoratedGraphQLObjectType) {
    // Mark the GraphQLObjectType object to avoid re-wrapping:
    if (objectType._authFieldsWrapped) {
      return;
    }
    objectType._authFieldsWrapped = true;

    const fields = objectType.getFields();

    Object.keys(fields).forEach((fieldName) => {
      const field = fields[fieldName];
      const { resolve = defaultFieldResolver } = field;
      field.resolve = async function (...args) {
        // Get the required Role from the field first, falling back
        // to the objectType if no Role is required by the field:
        const requiredRole =
          // TODO Solve via interface merging and custom .d.ts file
          // @ts-expect-error cannot fix this, would need to override a lot of stuff from ts internals
          field._requiredAuthRole || objectType._requiredAuthRole;

        if (!requiredRole) {
          return resolve.apply(this, args);
        }

        const context = args[2];
        const user = context.user;
        // TODO permission roles & where does it make sense to query db
        if (!user) {
          throw new Error('not authorized');
        }

        return resolve.apply(this, args);
      };
    });
  }
}
