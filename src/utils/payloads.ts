import { InterfaceType, Field, ObjectType } from 'type-graphql';
import { User } from '../entities/User';

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
