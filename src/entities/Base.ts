import { Field, ID, ObjectType } from 'type-graphql';
import { BeforeUpdate, Column, PrimaryGeneratedColumn } from 'typeorm';
import { v4 } from 'uuid';

// NOTE inspiration: https://github.com/driescroons/mikro-orm-graphql-example/blob/76eeaeddbf80a37a223c98b4784595170a457db3/src/utils/entities/base.entity.ts
@ObjectType({ isAbstract: true })
export abstract class BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  public id: string = v4();

  @Field()
  @Column()
  public createdAt: Date = new Date();

  @Field()
  @Column()
  public updatedAt: Date = new Date();

  @BeforeUpdate()
  updateTs() {
    this.updatedAt = new Date();
  }
}
