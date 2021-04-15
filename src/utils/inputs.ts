import {
  IsString,
  IsEmail,
  MinLength,
  IsAlphanumeric,
  IsNotEmpty
} from 'class-validator';
import { InputType, Field, ID } from 'type-graphql';
import { IsIdentifierAvailable } from '../constraints/IsIdentifierAvailable';
import { ActivityType } from '../entities/Activity';
import { WalletType } from '../entities/Wallet';

const MIN_PASSWORD_LENGTH = 5;

@InputType()
export class SignInUserContract {
  @Field()
  @IsNotEmpty()
  @IsString()
  identifier!: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  password!: string;
}

@InputType()
export class SignUpUserContract {
  @Field()
  @IsNotEmpty()
  @IsAlphanumeric()
  // TODO custom username and alias validation
  @IsIdentifierAvailable({
    message: 'Username "$value" already used'
  })
  username!: string;

  @Field()
  @IsNotEmpty()
  @IsEmail()
  @IsIdentifierAvailable({
    message: 'Email "$value" already used'
  })
  email!: string;

  // TODO better password validation
  @Field()
  @MinLength(MIN_PASSWORD_LENGTH, {
    message: `Password should be at least ${MIN_PASSWORD_LENGTH} characters long`
  })
  password!: string;
}

@InputType()
export class MwpAccount_CreateWalletInput {
  @Field(() => ID)
  tagId!: string;

  @Field()
  walletType!: WalletType;
}

@InputType()
export class MwpAccount_CreateBoostTransactionInput {
  @Field(() => ID)
  walletId!: string;

  @Field()
  amount!: number;
}

@InputType()
export class MwpAccount_AddBalanceInput {
  @Field(() => ID)
  walletId!: string;

  @Field()
  amount!: number;
}

@InputType()
export class MwpAccount_AddActivityInput {
  @Field(() => ActivityType)
  activityType!: ActivityType;

  // NOTE unused field: just used for purposes of not using single enum value: that could be misused to compute HMAC secret
  @Field()
  postId!: string;
}
