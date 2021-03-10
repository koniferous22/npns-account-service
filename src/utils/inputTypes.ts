import {
  IsString,
  IsEmail,
  MinLength,
  IsAlphanumeric,
  IsNotEmpty
} from 'class-validator';
import { InputType, Field } from 'type-graphql';
import { IsIdentifierAvailable } from '../constraints/IsIdentifierAvailable';

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
