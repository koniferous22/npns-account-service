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
}
