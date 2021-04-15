import { plainToClass } from 'class-transformer';
import {
  Arg,
  Authorized,
  Ctx,
  Directive,
  ID,
  Mutation,
  Resolver,
  UseMiddleware
} from 'type-graphql';
import { AccountServiceContext } from '../context';
import { Activity, ActivityType } from '../entities/Activity';
import { MultiWriteProxyHmacGuard } from '../middlewares/MultiWriteProxyHmacGuard';
import { MwpAccount_AddActivityInput } from '../utils/inputs';
import {
  MwpAccount_AddActivityPayload,
  MwpAccount_AddActivityRollbackPayload
} from '../utils/payloads';

@Resolver(() => Activity)
export class ActivityResolver {
  @Directive('@MwpTransaction')
  @UseMiddleware(MultiWriteProxyHmacGuard)
  @Authorized()
  @Mutation(() => MwpAccount_AddActivityPayload, {
    name: 'mwpAccount_AddActivity'
  })
  async addActivity(
    @Arg('payload') payload: MwpAccount_AddActivityInput,
    @Arg('digest') digest: string,
    @Ctx() ctx: AccountServiceContext
  ) {
    const activityRepo = ctx.em.getRepository(Activity);
    const createdActivity = activityRepo.create({
      activityType: payload.activityType
    });
    await activityRepo.save(createdActivity);
    return plainToClass(MwpAccount_AddActivityPayload, {
      createdActivity,
      message: `Activity "${createdActivity.id}" created`
    });
  }
  @Directive('@MwpRollback')
  @UseMiddleware(MultiWriteProxyHmacGuard)
  @Authorized()
  @Mutation(() => MwpAccount_AddActivityRollbackPayload, {
    name: 'mwpAccount_AddActivityRollback'
  })
  async AddActivityRollback(
    @Arg('payload', () => ID) payload: string,
    @Arg('digest') digest: string,
    @Ctx() ctx: AccountServiceContext
  ) {
    const activityToDelete = await ctx.em
      .getRepository(Activity)
      .findOneOrFail({ id: payload });
    await ctx.em.getRepository(Activity).delete({ id: payload });
    return plainToClass(MwpAccount_AddActivityRollbackPayload, {
      message: `Activity id: "${activityToDelete.id}", type: ${
        ActivityType[activityToDelete.activityType]
      } deleted`
    });
  }
}
