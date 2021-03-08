import { IsString, IsEmail, MinLength, IsAlphanumeric } from 'class-validator';
import { InputType, Field } from 'type-graphql';
import { IsIdentifierAvailable } from '../constraints/IsIdentifierAvailable';

const MIN_PASSWORD_LENGTH = 5;

@InputType()
export class SignInUserContract {
  @Field()
  @IsString()
  identifier!: string;

  @Field()
  @IsString()
  password!: string;
}

@InputType()
export class SignUpUserContract {
  @Field()
  @IsAlphanumeric()
  // TODO custom username and alias validation
  @IsIdentifierAvailable({
    message: 'Username "$value" already used'
  })
  username!: string;

  @Field()
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
