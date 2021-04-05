import { IsString, IsEmail, IsNotEmpty } from 'class-validator';
import { ArgsType, Field } from 'type-graphql';
import { IsIdentifierAvailable } from '../constraints/IsIdentifierAvailable';

@ArgsType()
export class FindUserByIdentifierArgs {
  @Field()
  @IsString()
  identifier!: string;
}

@ArgsType()
export class ValidateIdentifiersAvailableArgs {
  @Field()
  @IsEmail()
  @IsIdentifierAvailable({
    message: 'New email "$value" already used'
  })
  email!: string;

  @Field()
  @IsNotEmpty()
  @IsIdentifierAvailable({
    message: 'New username "$value" already used'
  })
  @IsString()
  usernameOrAlias!: string;
}

@ArgsType()
export class ConfirmTokenArgs {
  @Field()
  @IsString()
  token!: string;
}

@ArgsType()
export class RequestEmailChangeArgs {
  @Field()
  @IsEmail()
  @IsIdentifierAvailable({
    message: 'New email "$value" already used'
  })
  newEmail!: string;

  @Field()
  @IsString()
  password!: string;
}

@ArgsType()
export class ChangeAliasArgs {
  @Field()
  @IsNotEmpty()
  @IsIdentifierAvailable({
    message: 'New username "$value" already used'
  })
  @IsString()
  newAlias!: string;

  @Field()
  @IsString()
  password!: string;
}

@ArgsType()
export class UpdateOrValidatePasswordArgs {
  @Field()
  @IsNotEmpty()
  @IsString()
  newPassword!: string;

  @Field()
  @IsString()
  password!: string;
}

@ArgsType()
export class SubmitOrValidateForgottenPasswordArgs {
  @Field()
  @IsNotEmpty()
  @IsString()
  token!: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  newPassword!: string;

  @Field()
  @IsString()
  password!: string;
}
