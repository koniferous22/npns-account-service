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
export class RequestEmailChangeArgs {
  @Field()
  @IsEmail()
  newEmail!: string;
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
