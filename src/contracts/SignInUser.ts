import { IsString } from 'class-validator';
import { InputType, Field } from 'type-graphql';

@InputType()
export class SignInUserContract {
  @Field()
  @IsString()
  identifier!: string;

  @Field()
  @IsString()
  password!: string;
}
