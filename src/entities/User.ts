import { Entity, Column, Unique } from 'typeorm';
import { Field, ObjectType } from 'type-graphql';
import { BaseEntity } from './Base';

@ObjectType()
@Entity()
@Unique(['username', 'email'])
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
