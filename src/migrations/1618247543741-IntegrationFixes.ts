import { MigrationInterface, QueryRunner } from 'typeorm';

export class IntegrationFixes1618247543741 implements MigrationInterface {
  name = 'IntegrationFixes1618247543741';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "wallet" ADD "tagId" uuid NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "wallet" ALTER COLUMN "balance" SET DEFAULT '0'`
    );
    await queryRunner.query(
      `ALTER TABLE "wallet" ADD CONSTRAINT "UQ_0ac5d1e71916dc5ed07d44d78ba" UNIQUE ("tagId", "walletType")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wallet" DROP CONSTRAINT "UQ_0ac5d1e71916dc5ed07d44d78ba"`
    );
    await queryRunner.query(
      `ALTER TABLE "wallet" ALTER COLUMN "balance" DROP DEFAULT`
    );
    await queryRunner.query(`ALTER TABLE "wallet" DROP COLUMN "tagId"`);
  }
}
