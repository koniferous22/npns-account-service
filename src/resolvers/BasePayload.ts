import { InterfaceType, Field } from 'type-graphql';

@InterfaceType()
export abstract class BasePayload {
  @Field()
  message!: string;
}
