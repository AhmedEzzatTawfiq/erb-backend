import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmployeeAvatar1791468914449 implements MigrationInterface {
    name = 'AddEmployeeAvatar1791468914449'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "employees" ADD "avatar" character varying`);
        await queryRunner.query(`ALTER TABLE "products" ADD "avatar" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "avatar" character varying`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "avatar"`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "avatar" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "avatar"`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "avatar" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "avatar"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "avatar"`);
    }

}
