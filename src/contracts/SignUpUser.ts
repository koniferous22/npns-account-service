import { IsEmail, IsString } from 'class-validator';
import { Field, InputType } from 'type-graphql';

@InputType()
export class SignUpUserContract {
  @Field()
  @IsString()
  username!: string;

  @Field()
  @IsEmail()
  email!: string;
}
