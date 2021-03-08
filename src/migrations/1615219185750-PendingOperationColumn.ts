import { MigrationInterface, QueryRunner } from 'typeorm';

export class PendingOperationColumn1615219185750 implements MigrationInterface {
  name = 'PendingOperationColumn1615219185750';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" RENAME COLUMN "isVerified" TO "pendingOperation"`
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "pendingOperation"`
    );
    await queryRunner.query(
      `CREATE TYPE "user_pendingoperation_enum" AS ENUM('0', '1', '2', '3')`
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "pendingOperation" "user_pendingoperation_enum" DEFAULT '0'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "pendingOperation"`
    );
    await queryRunner.query(`DROP TYPE "user_pendingoperation_enum"`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "pendingOperation" boolean NOT NULL DEFAULT false`
    );
    await queryRunner.query(
      `ALTER TABLE "user" RENAME COLUMN "pendingOperation" TO "isVerified"`
    );
  }
}
