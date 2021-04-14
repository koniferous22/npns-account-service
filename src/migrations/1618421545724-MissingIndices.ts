import { MigrationInterface, QueryRunner } from 'typeorm';

export class MissingIndices1618421545724 implements MigrationInterface {
  name = 'MissingIndices1618421545724';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_900eb6b5efaecf57343e4c0e79" ON "transaction" ("walletId") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3571467bcbe021f66e2bdce96e" ON "activity" ("userId") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_3571467bcbe021f66e2bdce96e"`);
    await queryRunner.query(`DROP INDEX "IDX_900eb6b5efaecf57343e4c0e79"`);
  }
}
