import { Directive, Field, ObjectType, registerEnumType } from 'type-graphql';
import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from './Base';
import { User } from './User';

// ! Enum keys have to stay UpperCamelCase otherwise it will generate different values (complicated because renaming with graphql-codegen/type-graphql plugin doesn't work)
// ! If different values per enum are generated across federation, valid schema won't be composed
export enum ActivityType {
  PostChallenge = 0,
  PostSubmission = 1,
  PostReply = 2,
  EditChallenge = 3,
  EditSubmission = 4,
  EditReply = 5
}

registerEnumType(ActivityType, {
  name: 'ActivityType',
  description: 'Type of activity done by user'
});

@Directive(`@key(fields: "id")`)
@ObjectType()
@Entity()
export class Activity extends BaseEntity {
  @Field(() => User)
  @ManyToOne(() => User, {
    lazy: true,
    nullable: false
  })
  user!: Promise<User>;

  @Field(() => ActivityType)
  @Column({
    type: 'enum',
    enum: ActivityType
  })
  activityType!: ActivityType;
}
