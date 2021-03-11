import { IsString, IsEmail, IsNotEmpty, IsHash } from 'class-validator';
import { ArgsType, Field } from 'type-graphql';
import { IsIdentifierAvailable } from '../constraints/IsIdentifierAvailable';

@ArgsType()
export class FindUserByIdentifierArgs {
  @Field()
  @IsString()
  identifier!: string;
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
export class UpdatePasswordArgs {
  @Field()
  @IsNotEmpty()
  @IsString()
  newPassword!: string;

  @Field()
  @IsString()
  password!: string;
}

@ArgsType()
export class SubmitPasswordResetArgs {
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
