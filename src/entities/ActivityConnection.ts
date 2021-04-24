import { plainToClass, Type } from 'class-transformer';
import { IsPositive } from 'class-validator';
import { Field, ID, InputType, Int, ObjectType } from 'type-graphql';
import { LessThanOrEqual, MoreThan } from 'typeorm';
import { AccountServiceContext } from '../context';
import { Activity } from './Activity';

@InputType()
export class ActivityByUserIdInput {
  @Field(() => ID)
  user!: string;

  @Field(() => Int)
  @IsPositive()
  first!: number;

  @Field({
    nullable: true
  })
  afterDate?: Date;

  @Field(() => ID, {
    nullable: true
  })
  afterId?: string;
}

@ObjectType()
class ActivityCursor {
  @Field(() => ID)
  id!: string;

  @Field()
  date!: Date;
}

@ObjectType()
class ActivityEdge {
  @Field()
  cursor!: ActivityCursor;

  @Field(() => Activity)
  node!: Activity;
}

@ObjectType()
class ActivityPageInfo {
  @Field()
  hasNextPage!: boolean;
}

@ObjectType()
export class ActivityConnection {
  @Type(() => ActivityEdge)
  @Field(() => [ActivityEdge])
  edges!: ActivityEdge[];

  @Type(() => ActivityPageInfo)
  @Field(() => ActivityPageInfo)
  pageInfo!: ActivityPageInfo;

  static async activityConnection(
    input: ActivityByUserIdInput,
    ctx: AccountServiceContext
  ) {
    const activityRepo = ctx.em.getRepository(Activity);
    const activities = await activityRepo.find({
      where: {
        user: input.user,
        ...(input.afterDate && {
          createdAt: LessThanOrEqual(input.afterDate)
        }),
        ...(input.afterId && {
          id: MoreThan(input.afterId)
        })
      },
      take: input.first,
      order: {
        createdAt: 'DESC'
      }
    });

    let hasNextPage = false;
    if (activities.length === input.first) {
      const lastElem = activities[input.first - 1];
      hasNextPage =
        (await activityRepo.count({
          where: {
            user: input.user,
            createdAt: LessThanOrEqual(lastElem.createdAt),
            id: MoreThan(lastElem.id)
          }
        })) > 0;
    }

    const edges = activities.map((activityObject) => ({
      cursor: {
        id: activityObject.id,
        date: activityObject.createdAt
      },
      node: activityObject
    }));
    const pageInfo = {
      hasNextPage
    };
    return plainToClass(ActivityConnection, { edges, pageInfo });
  }
}
