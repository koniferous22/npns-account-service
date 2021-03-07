import { Entity, Column, Unique } from 'typeorm';
import { Directive, Field, ObjectType } from 'type-graphql';
import { BaseEntity } from './Base';

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

  @Field()
  @Column({
    default: false
  })
  isVerified!: boolean;

  @Field()
  @Column({
    default: false
  })
  hasNsfwAllowed!: boolean;
}
