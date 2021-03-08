import { MigrationInterface, QueryRunner } from 'typeorm';

export class AccountAlias1615241366762 implements MigrationInterface {
  name = 'AccountAlias1615241366762';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "UQ_f4ca2c1e7c96ae6e8a7cca9df80"`
    );
    await queryRunner.query(`ALTER TABLE "user" ADD "alias" character varying`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "UQ_1d5324dc4f0c41f17ebe4bf5aba" UNIQUE ("alias")`
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "UQ_44944d78e51fc788cfa008326b6" UNIQUE ("username", "email", "alias")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "UQ_44944d78e51fc788cfa008326b6"`
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "UQ_1d5324dc4f0c41f17ebe4bf5aba"`
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "alias"`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "UQ_f4ca2c1e7c96ae6e8a7cca9df80" UNIQUE ("username", "email")`
    );
  }
}
