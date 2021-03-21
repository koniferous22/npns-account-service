import { Directive, Field, ObjectType, registerEnumType } from 'type-graphql';
import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from './Base';
import { User } from './User';

export enum ActivityType {
  POST_CHALLENGE = 0,
  POST_SUBMISSION = 1,
  POST_REPLY = 2,
  EDIT_CHALLENGE = 3,
  EDIT_SUBMISSION = 4,
  EDIT_REPLY = 5
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
