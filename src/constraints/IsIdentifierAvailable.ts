import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments
} from 'class-validator';
import { getRepository } from 'typeorm';
import { User } from '../entities/User';

@ValidatorConstraint({ async: true })
export class IsIdentifierAvailableConstraint
  implements ValidatorConstraintInterface {
  validate(identifier: string, args: ValidationArguments) {
    return getRepository(User)
      .findOne({
        where: [{ username: identifier }, { email: identifier }]
      })
      .then((foundUser) => !foundUser);
  }
}

export function IsIdentifierAvailable(validationOptions?: ValidationOptions) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsIdentifierAvailableConstraint
    });
  };
}
