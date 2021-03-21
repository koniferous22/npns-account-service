import { Directive, Field, ObjectType } from 'type-graphql';
import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from './Base';
import { User } from './User';

@Directive(`@key(fields: "id")`)
@ObjectType()
@Entity()
export class Wallet extends BaseEntity {
  @Field(() => User)
  @ManyToOne(() => User, {
    lazy: true,
    nullable: false
  })
  user!: Promise<User>;

  // TODO modify account owner decorator
  @Field()
  @Column()
  balance!: number;
}
