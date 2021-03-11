import { PendingOperation } from '../entities/User';
import templates from '../external/nodemailer/templates';

export class UserNotFoundError extends Error {
  name = 'UserNotFoundError';
  constructor(public identifier: string) {
    super(`User with email/username: "${identifier}" not found`);
  }
}

export class WrongPasswordError extends Error {
  name = 'WrongPasswordError';
  constructor() {
    super('Attempted login with wrong password');
  }
}

export class CacheCreateTokenError extends Error {
  name = 'CacheCreateTokenError';
  constructor(
    public identifier: string,
    public executedOperation: PendingOperation
  ) {
    super(
      `Couldn't create verification token for "${identifier}", operation: ${executedOperation}`
    );
  }
}

export class CacheCleanupError extends Error {
  name = 'CacheCleanupError';
  constructor(
    public identifier: string,
    public executedOperation: PendingOperation
  ) {
    super(
      `Couldn't perform cleanup of key "${identifier}" during operation: ${executedOperation}`
    );
  }
}

type TemplateType = keyof typeof templates;

export class NodemailerError extends Error {
  name = 'NodemailerError';
  constructor(public recipient: string, public template: TemplateType) {
    super(
      `Error while sending email to "${recipient}", with template "${template}"`
    );
  }
}

export class UserAlreadyVerifiedError extends Error {
  name = 'UserAlreadyVerifiedError';
  constructor(public identifier: string) {
    super(`User "${identifier}" is already verified after sign up`);
  }
}

export class PendingProfileOperationInProgressError extends Error {
  name = 'PendingProfileOperationInProgressError';
  constructor(
    public identifier: string,
    public operationType: PendingOperation
  ) {
    super(
      `User "${identifier}" has already operation "${operationType}" in progress`
    );
  }
}

export class AccountOwnerAccessError extends Error {
  name = 'AccountOwnerAccessError';
  constructor(public field: string) {
    super(
      `Attempting to access "${field}" which can be accessed only by account owner`
    );
  }
}

export class ConfigError extends Error {
  name = 'ConfigError';
  constructor(public errors: string[]) {
    super(errors.join('\n'));
  }
}

export class UpdatedWithEqualPasswordError extends Error {
  name = 'UpdatedWithEqualPasswordError';
  constructor(public identifier: string) {
    super(
      `Updated password should be different from current one (user: "${identifier}")`
    );
  }
}

export class PayloadMissingError extends Error {
  name = 'PayloadMissingError';
  constructor(
    public identifier: string,
    public pendingOperation: PendingOperation,
    public token: string
  ) {
    super(
      `Profile operation "${pendingOperation}" for user "${identifier}", with token "${token}" has missing payload`
    );
  }
}

export class TokenNotFoundError extends Error {
  name = 'TokenNotFoundError';
  constructor(public token: string, public pendingOperation: PendingOperation) {
    super(`Token "${token}" for operation "${pendingOperation}" not found`);
  }
}

export class WrongPendingOperationError extends Error {
  name = 'WrongPendingOperationError';
  constructor(
    public identifier: string,
    public expectedOperationType: PendingOperation,
    public actualOperationType: PendingOperation | null
  ) {
    super(
      `Expected operation "${expectedOperationType}" for user "${identifier}", got "${actualOperationType}"`
    );
  }
}
