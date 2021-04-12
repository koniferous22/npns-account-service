import { Directive, Field, ObjectType, registerEnumType } from 'type-graphql';
import { Column, Entity, ManyToOne, OneToMany, Unique } from 'typeorm';
import { BaseEntity } from './Base';
import { Transaction } from './Transaction';
import { User } from './User';

export enum WalletType {
  Monetary = 0,
  Virtual = 1
}

registerEnumType(WalletType, {
  name: 'WalletType',
  description: 'Determines whether wallet holds physical/virtual currency'
});

@Directive(`@key(fields: "id")`)
@ObjectType()
@Unique(['tagId', 'walletType'])
@Entity()
export class Wallet extends BaseEntity {
  @Field(() => User)
  @ManyToOne(() => User, {
    lazy: true,
    nullable: false
  })
  user!: User | Promise<User>;

  @Field(() => WalletType)
  @Column({
    type: 'enum',
    enum: WalletType
  })
  walletType!: WalletType;

  @Field()
  @Column({
    default: 0
  })
  balance!: number;

  @Field(() => [Transaction])
  @OneToMany(() => Transaction, (transaction) => transaction.wallet, {
    lazy: true
  })
  transactions!: Promise<Transaction[]>;

  @Column({
    type: 'uuid'
  })
  tagId!: string;
}
