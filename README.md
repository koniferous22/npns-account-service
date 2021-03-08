# npns-account-service
Account service for npns

## Generating migrations
* `npm run orm -- migration:generate -c <<CONNECTION>> -n <<MIGRATION_NAME>>`
  * `<<MIGRATION_NAME>>: string`
* Executing in docker compose:
* `docker-compose exec -- gateway npm run orm -- migration:generate -n <<MIGRATION_NAME>>`

## TODO
* verification token cache certificates 
* define pwd constraints
* proper responses for error handling cases
* Simplify config API if possible to make ASTs more understanadable
* Limit on resend sign up
