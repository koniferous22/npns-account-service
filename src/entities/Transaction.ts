import { Directive, ObjectType, Field, registerEnumType } from 'type-graphql';
import { Entity, ManyToOne, Column } from 'typeorm';
import { BaseEntity } from './Base';
import { Wallet } from './Wallet';

export enum TransactionType {
  CHALLENGE_BOOST = 0,
  VIRTUAL_REWARD = 1,
  MONETARY_REWARD = 2
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
  wallet!: Promise<Wallet>;

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
