import Knex from 'knex';

export async function up(knex: Knex) {
	return knex.schema.createTable('authusers', (table) => {
		table.increments('id').primary();
		table.string('name').notNullable();
		table.string('lastname').notNullable();
		table.string('email').notNullable().unique();
		table.string('password').notNullable();
	});
}

export async function down(knex: Knex) {
	return knex.schema.dropTable('authusers');
}
