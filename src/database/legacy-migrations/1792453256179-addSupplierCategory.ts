import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSupplierCategory1792453256179 implements MigrationInterface {
    name = 'AddSupplierCategory1792453256179'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "suppliers" ADD "categoryId" uuid`);
        await queryRunner.query(`ALTER TABLE "suppliers" ADD CONSTRAINT "FK_94cd45deefb8a1399b5ce15c9c6" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "suppliers" DROP CONSTRAINT "FK_94cd45deefb8a1399b5ce15c9c6"`);
        await queryRunner.query(`ALTER TABLE "suppliers" DROP COLUMN "categoryId"`);
    }

}
