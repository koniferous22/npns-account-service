import { MigrationInterface, QueryRunner } from 'typeorm';

export class WalletTransactionActivity1616353630920
  implements MigrationInterface {
  name = 'WalletTransactionActivity1616353630920';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "wallet_wallettype_enum" AS ENUM('0', '1')`
    );
    await queryRunner.query(
      `CREATE TABLE "wallet" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL, "updatedAt" TIMESTAMP NOT NULL, "walletType" "wallet_wallettype_enum" NOT NULL, "balance" integer NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "PK_bec464dd8d54c39c54fd32e2334" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TYPE "transaction_transactiontype_enum" AS ENUM('0', '1', '2')`
    );
    await queryRunner.query(
      `CREATE TABLE "transaction" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL, "updatedAt" TIMESTAMP NOT NULL, "transactionType" "transaction_transactiontype_enum" NOT NULL, "amount" integer NOT NULL, "walletId" uuid NOT NULL, CONSTRAINT "PK_89eadb93a89810556e1cbcd6ab9" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TYPE "activity_activitytype_enum" AS ENUM('0', '1', '2', '3', '4', '5')`
    );
    await queryRunner.query(
      `CREATE TABLE "activity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL, "updatedAt" TIMESTAMP NOT NULL, "activityType" "activity_activitytype_enum" NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "PK_24625a1d6b1b089c8ae206fe467" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TYPE "public"."user_pendingoperation_enum" RENAME TO "user_pendingoperation_enum_old"`
    );
    await queryRunner.query(
      `CREATE TYPE "user_pendingoperation_enum" AS ENUM('0', '1', '2')`
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "pendingOperation" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "pendingOperation" TYPE "user_pendingoperation_enum" USING "pendingOperation"::"text"::"user_pendingoperation_enum"`
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "pendingOperation" SET DEFAULT '0'`
    );
    await queryRunner.query(`DROP TYPE "user_pendingoperation_enum_old"`);
    await queryRunner.query(
      `COMMENT ON COLUMN "user"."pendingOperation" IS NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "wallet" ADD CONSTRAINT "FK_35472b1fe48b6330cd349709564" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD CONSTRAINT "FK_900eb6b5efaecf57343e4c0e79d" FOREIGN KEY ("walletId") REFERENCES "wallet"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "activity" ADD CONSTRAINT "FK_3571467bcbe021f66e2bdce96ea" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "activity" DROP CONSTRAINT "FK_3571467bcbe021f66e2bdce96ea"`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP CONSTRAINT "FK_900eb6b5efaecf57343e4c0e79d"`
    );
    await queryRunner.query(
      `ALTER TABLE "wallet" DROP CONSTRAINT "FK_35472b1fe48b6330cd349709564"`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "user"."pendingOperation" IS NULL`
    );
    await queryRunner.query(
      `CREATE TYPE "user_pendingoperation_enum_old" AS ENUM('0', '1', '2', '3')`
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "pendingOperation" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "pendingOperation" TYPE "user_pendingoperation_enum_old" USING "pendingOperation"::"text"::"user_pendingoperation_enum_old"`
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "pendingOperation" SET DEFAULT '0'`
    );
    await queryRunner.query(`DROP TYPE "user_pendingoperation_enum"`);
    await queryRunner.query(
      `ALTER TYPE "user_pendingoperation_enum_old" RENAME TO  "user_pendingoperation_enum"`
    );
    await queryRunner.query(`DROP TABLE "activity"`);
    await queryRunner.query(`DROP TYPE "activity_activitytype_enum"`);
    await queryRunner.query(`DROP TABLE "transaction"`);
    await queryRunner.query(`DROP TYPE "transaction_transactiontype_enum"`);
    await queryRunner.query(`DROP TABLE "wallet"`);
    await queryRunner.query(`DROP TYPE "wallet_wallettype_enum"`);
  }
}
