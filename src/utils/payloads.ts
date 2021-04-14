import { InterfaceType, Field, ObjectType } from 'type-graphql';
import { Activity } from '../entities/Activity';
import { Transaction } from '../entities/Transaction';
import { User } from '../entities/User';
import { Wallet } from '../entities/Wallet';

@InterfaceType()
export abstract class BasePayload {
  @Field()
  message!: string;
}

@ObjectType({ implements: BasePayload })
export class SignUpUserPayload implements BasePayload {
  message!: string;
  @Field(() => User)
  createdUser!: User;
}

@ObjectType({ implements: BasePayload })
export class ResendSignUpTokenPaylod implements BasePayload {
  message!: string;
}

@ObjectType({ implements: BasePayload })
export class SignInUserPayload implements BasePayload {
  message!: string;
  @Field()
  token!: string;
  @Field(() => User)
  user!: User;
}

@ObjectType({ implements: BasePayload })
export class ForgotPasswordPayload implements BasePayload {
  message!: string;
}

@ObjectType({ implements: BasePayload })
export class RequestEmailChangePayload implements BasePayload {
  message!: string;
}

@ObjectType({ implements: BasePayload })
export class ChangeAliasPayload implements BasePayload {
  message!: string;

  @Field(() => User)
  updatedUser!: User;
}

@ObjectType({ implements: BasePayload })
export class UpdatePasswordPayload implements BasePayload {
  message!: string;
}

@ObjectType({ implements: BasePayload })
export class ConfirmSignUpTokenPayload implements BasePayload {
  message!: string;
}

@ObjectType({ implements: BasePayload })
export class ConfirmEmailResetTokenPayload implements BasePayload {
  message!: string;

  @Field(() => User)
  updatedUser!: User;
}

@ObjectType({ implements: BasePayload })
export class ValidatePasswordResetTokenPayload implements BasePayload {
  message!: string;
}

@ObjectType({ implements: BasePayload })
export class SubmitPasswordResetPayload implements BasePayload {
  message!: string;
}

@ObjectType({ implements: BasePayload })
export class MwpAccount_CreateWalletPayload implements BasePayload {
  message!: string;

  @Field(() => Wallet)
  createdWallet!: Wallet;
}

@ObjectType({ implements: BasePayload })
export class MwpAccount_CreateWalletRollbackPayload implements BasePayload {
  message!: string;
}

@ObjectType({ implements: BasePayload })
export class MwpAccount_CreateBoostTransactionPayload implements BasePayload {
  message!: string;

  @Field(() => Transaction)
  createdTransaction!: Transaction;
}

@ObjectType({ implements: BasePayload })
export class MwpAccount_CreateBoostTransactionRollbackPayload
  implements BasePayload {
  message!: string;
}

@ObjectType({ implements: BasePayload })
export class MwpAccount_AddBalancePayload implements BasePayload {
  message!: string;

  @Field(() => Wallet)
  wallet!: Wallet;

  @Field(() => Transaction)
  transaction!: Transaction;
}

@ObjectType({ implements: BasePayload })
export class MwpAccount_AddBalanceRollbackPayload implements BasePayload {
  message!: string;
}

@ObjectType({ implements: BasePayload })
export class MwpAccount_AddActivityPayload implements BasePayload {
  message!: string;

  @Field(() => Activity)
  createdActivity!: Activity;
}

@ObjectType({ implements: BasePayload })
export class MwpAccount_AddActivityRollbackPayload implements BasePayload {
  message!: string;
}
