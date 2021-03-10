import { Entity, Column, Unique } from 'typeorm';
import {
  Directive,
  Field,
  ObjectType,
  registerEnumType,
  UseMiddleware
} from 'type-graphql';
import { BaseEntity } from './Base';
import { AccountOwnerGuard } from '../middlewares/AccountOwnerGuard';

// TODO normally would prefer union types, but not possible in type-graphql
export enum PendingOperation {
  SIGN_UP,
  FORGOT_PASSWORD,
  CHANGE_EMAIL
}

registerEnumType(PendingOperation, {
  name: 'PendingOperation',
  description:
    'Description of pending update that has to be confirmed via email'
});

@Directive(`@key(fields: "id")`)
@ObjectType()
@Entity()
@Unique(['username', 'email', 'alias'])
@Unique(['username'])
@Unique(['email'])
@Unique(['alias'])
export class User extends BaseEntity {
  @Field()
  @Column()
  username!: string;

  @Field()
  @Column()
  email!: string;

  @Field({
    nullable: true
  })
  @Column({
    nullable: true,
    default: undefined
  })
  alias?: string;

  @Column()
  password!: string;

  @UseMiddleware(AccountOwnerGuard)
  @Field(() => PendingOperation)
  @Column({
    type: 'enum',
    enum: PendingOperation,
    nullable: true,
    default: PendingOperation.SIGN_UP
  })
  pendingOperation!: PendingOperation | null;

  @Field()
  @Column({
    default: false
  })
  hasNsfwAllowed!: boolean;
}
