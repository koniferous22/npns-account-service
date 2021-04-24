import { plainToClass, Type } from 'class-transformer';
import { IsNotEmpty, IsPositive, IsUUID } from 'class-validator';
import { Field, ID, InputType, Int, ObjectType } from 'type-graphql';
import { In, LessThanOrEqual, MoreThan } from 'typeorm';
import { AccountServiceContext } from '../context';
import { Transaction } from './Transaction';

@InputType()
export class TransactionByWalletIdInput {
  @Field(() => Int)
  @IsPositive()
  first!: number;

  @Field({
    nullable: true
  })
  afterDate!: Date;

  @Field(() => ID, {
    nullable: true
  })
  afterId!: string;
}

@InputType()
export class TransactionByWalletIdsInput extends TransactionByWalletIdInput {
  @IsNotEmpty({
    each: true
  })
  @IsUUID(4, {
    each: true
  })
  @Field(() => [ID])
  wallets!: string[];
}

@ObjectType()
class TransactionCursor {
  @Field(() => ID)
  id!: string;

  @Field()
  date!: Date;
}

@ObjectType()
class TransactionEdge {
  @Field()
  cursor!: TransactionCursor;

  @Field(() => Transaction)
  node!: Transaction;
}

@ObjectType()
class TransactionPageInfo {
  @Field()
  hasNextPage!: boolean;
}

@ObjectType()
export class TransactionConnection {
  @Type(() => TransactionEdge)
  @Field(() => [TransactionEdge])
  edges!: TransactionEdge[];

  @Type(() => TransactionPageInfo)
  @Field(() => TransactionPageInfo)
  pageInfo!: TransactionPageInfo;

  static async transactionConnection(
    input: TransactionByWalletIdsInput,
    ctx: AccountServiceContext
  ) {
    const transactionRepo = ctx.em.getRepository(Transaction);
    const transaction = await transactionRepo.find({
      where: {
        wallet: In(input.wallets),
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
    if (transaction.length === input.first) {
      const lastElem = transaction[input.first - 1];
      hasNextPage =
        (await transactionRepo.count({
          where: {
            wallet: In(input.wallets),
            createdAt: LessThanOrEqual(lastElem.createdAt),
            id: MoreThan(lastElem.id)
          }
        })) > 0;
    }

    const edges = transaction.map((transactionObject) => ({
      cursor: {
        id: transactionObject.id,
        date: transactionObject.createdAt
      },
      node: transactionObject
    }));
    const pageInfo = {
      hasNextPage
    };
    return plainToClass(TransactionConnection, { edges, pageInfo });
  }
}
