import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateCustomer1790727867325
  implements MigrationInterface
{
  name = 'UpdateCustomer1790727867325';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "customers" DROP COLUMN "name"`,
    );

    await queryRunner.query(
      `ALTER TABLE "customers" ADD "companyName" character varying(100) NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "customers" ADD "contactName" character varying(100) NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "customers" ADD "avatar" character varying(255)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "customers" DROP COLUMN "avatar"`,
    );

    await queryRunner.query(
      `ALTER TABLE "customers" DROP COLUMN "contactName"`,
    );

    await queryRunner.query(
      `ALTER TABLE "customers" DROP COLUMN "companyName"`,
    );

    await queryRunner.query(
      `ALTER TABLE "customers" ADD "name" character varying(100) NOT NULL`,
    );
  }
}