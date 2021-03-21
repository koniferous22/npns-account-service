# npns-account-service
Account service for npns

## Generating migrations
* `npm run orm -- migration:generate -n <<MIGRATION_NAME>>`
  * `<<MIGRATION_NAME>>: string`
* Executing in docker compose:
* `docker-compose exec -- account_service npm run orm -- migration:generate -n <<MIGRATION_NAME>>`

## TODO
* verification token cache certificates 
* proper responses for error handling cases
* Simplify config API if possible to make ASTs more understanadable
* password custom validator
* Email Forms instead of confirmation link
* bcrypt validation decorator
* Pagination/Cursor on User -> Activities & Wallet -> Transaction

## TO CONSIDER ??
* Request limit on ResendSignUp
* schema directives on some fields with special behaviour
  * for example AccountOwnerGuard
* Which wallet/transaction data can be public
