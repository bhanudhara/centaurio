import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTasks1780000000000 implements MigrationInterface {
  name = 'CreateTasks1780000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "tasks" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "title" character varying(140) NOT NULL,
        "description" text NOT NULL DEFAULT '',
        "status" character varying NOT NULL DEFAULT 'todo',
        "priority" character varying NOT NULL DEFAULT 'medium',
        "dueDate" date,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tasks_id" PRIMARY KEY ("id")
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "tasks"');
  }
}
