import { MigrationInterface, QueryRunner } from "typeorm";

export class EditEmployeeAvatar1791639331285 implements MigrationInterface {
    name = 'EditEmployeeAvatar1791639331285'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "employees" ADD "avatarPublicId" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "avatarPublicId"`);
    }

}
