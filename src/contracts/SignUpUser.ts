import { IsEmail, IsString, MinLength } from 'class-validator';
import { Field, InputType } from 'type-graphql';

const MIN_PASSWORD_LENGTH = 5;

@InputType()
export class SignUpUserContract {
  @Field()
  @IsString()
  username!: string;

  @Field()
  @IsEmail()
  email!: string;

  // TODO better password validation
  @Field()
  @MinLength(MIN_PASSWORD_LENGTH, {
    message: `Password should be at least ${MIN_PASSWORD_LENGTH} characters long`
  })
  password!: string;
}
