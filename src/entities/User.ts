import { Entity, Column, Unique } from 'typeorm';
import { Directive, Field, ObjectType, registerEnumType } from 'type-graphql';
import { BaseEntity } from './Base';

// TODO normally would prefer union types, but 
export enum PendingOperation {
  SIGN_UP,
  RESET_PASSWORD,
  CHANGE_EMAIL,
  CHANGE_USERNAME
}

registerEnumType(PendingOperation, {
  name: 'PendingOperation',
  description: 'Description of pending update that has to be confirmed via email'
});

@Directive(`@key(fields: "id")`)
@ObjectType()
@Entity()
@Unique(['username', 'email'])
@Unique(['username'])
@Unique(['email'])
export class User extends BaseEntity {
  @Field()
  @Column()
  username!: string;

  @Field()
  @Column()
  email!: string;

  @Column()
  password!: string;

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
