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
  * possibly replace with `typed-env-parser` package
* password custom validator
* Email Forms instead of confirmation link
* bcrypt validation decorator
* Pagination/Cursor on User -> Activities & Wallet -> Transaction
* Find better workaround for reference resolving
* Document Mwp transactions with directives
  * Not possible atm, bc apollo/federation, doesn't have config parameter for custom directives, i.e. cancels everything else :(

## TO CONSIDER ??
* Request limit on ResendSignUp
* schema directives on some fields with special behaviour
  * for example AccountOwnerGuard
* Which wallet/transaction data can be public
* Optimize dockerfile build context
* Migrate to prisma when it makes sense
* SHOULD Wallet be challenge owner (in other words, should activity be related to wallet, or User)

## Possible features
* Boost from existing wallet balance
