import { Directive, ObjectType, Field, registerEnumType } from 'type-graphql';
import { Entity, ManyToOne, Column } from 'typeorm';
import { BaseEntity } from './Base';
import { Wallet } from './Wallet';

// ! Enum keys have to stay UpperCamelCase otherwise it will generate different values (complicated because renaming with graphql-codegen/type-graphql plugin doesn't work)
// ! If different values per enum are generated across federation, valid schema won't be composed
export enum TransactionType {
  ChallengeBoost = 0,
  VirtualReward = 1,
  MonetaryReward = 2
}

registerEnumType(TransactionType, {
  name: 'TransactionType',
  description:
    'Describes context of transaction (whether related wallet/user is buyer or seller)'
});

@Directive(`@key(fields: "id")`)
@ObjectType()
@Entity()
export class Transaction extends BaseEntity {
  @Field(() => Wallet)
  @ManyToOne(() => Wallet, {
    lazy: true,
    nullable: false
  })
  wallet!: Wallet | Promise<Wallet>;

  @Field(() => TransactionType)
  @Column({
    type: 'enum',
    enum: TransactionType
  })
  transactionType!: TransactionType;

  @Field()
  @Column()
  amount!: number;
}
