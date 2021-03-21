import { Directive, Field, ObjectType, registerEnumType } from 'type-graphql';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './Base';
import { Transaction } from './Transaction';
import { User } from './User';

export enum WalletType {
  MONETARY = 0,
  VIRTUAL = 1
}

registerEnumType(WalletType, {
  name: 'WalletType',
  description: 'Determines whether wallet holds physical/virtual currency'
});

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

  @Field(() => WalletType)
  @Column({
    type: 'enum',
    enum: WalletType
  })
  walletType!: WalletType;

  @Field()
  @Column()
  balance!: number;

  @Field(() => [Transaction])
  @OneToMany(() => Transaction, (transaction) => transaction.wallet, {
    lazy: true
  })
  transactions!: Promise<Transaction[]>;
}
