import db from '../database/connections';
import convertHourToMinutes from '../utils/convertHourToMinutes';
import { Request, Response, response } from 'express';

interface ScheudleItem {
	week_day: number;
	from: string;
	to: string;
}

export default class ClassController {
	async index(req: Request, res: Response) {
		const filters = req.query;

		if (!filters.week_day || !filters.subject || !filters.time) {
			return res.status(400).json({ error: 'Missing filters' });
		}

		const timeInMinutes = convertHourToMinutes(filters.time as string);

		const classes = await db('classes')
			.whereExists(function () {
				this.select('class_scheudle.*')
					.from('class_scheudle')
					.whereRaw('`class_scheudle`.`class_id` = `classes`.`id`')
					.whereRaw('`class_scheudle`.`week_day` = ??', [
						Number(filters.week_day),
					])
					.whereRaw('`class_scheudle`.`from` <= ??', [timeInMinutes])
					.whereRaw('`class_scheudle`.`to` > ??', [timeInMinutes]);
			})
			.where('classes.subject', '=', filters.subject as string)
			.join('users', 'classes.user_id', '=', 'users.id')
			.select(['classes.*', 'users.*']);

		return res.json(classes);
	}

	async create(req: Request, res: Response) {
		const { name, avatar, whatsapp, bio, subject, cost, scheudle } = req.body;

		const trx = await db.transaction();

		try {
			const insertedUsersId = await trx('users').insert({
				name,
				avatar,
				whatsapp,
				bio,
			});

			const user_id = insertedUsersId[0];

			const insertedClassesIds = await trx('classes').insert({
				subject,
				cost,
				user_id,
			});

			const class_id = insertedClassesIds[0];

			const classScheudle = scheudle.map((scheudleItem: ScheudleItem) => {
				return {
					class_id,
					week_day: scheudleItem.week_day,
					from: convertHourToMinutes(scheudleItem.from),
					to: convertHourToMinutes(scheudleItem.to),
				};
			});

			await trx('class_scheudle').insert(classScheudle);

			await trx.commit();

			return res.status(201).send();
		} catch (err) {
			console.log(err);
			await trx.rollback();
			return res.status(400).json({ error: 'Error while creating new class' });
		}
	}
}
