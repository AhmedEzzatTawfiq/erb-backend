import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAllAvatars1791822134892 implements MigrationInterface {
    name = 'AddAllAvatars1791822134892'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" ADD "avatarPublicId" character varying`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "avatarPublicId" character varying`);
        await queryRunner.query(`ALTER TABLE "suppliers" ADD "avatarPublicId" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "avatarPublicId" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatarPublicId"`);
        await queryRunner.query(`ALTER TABLE "suppliers" DROP COLUMN "avatarPublicId"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "avatarPublicId"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "avatarPublicId"`);
    }

}
