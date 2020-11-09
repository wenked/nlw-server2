import db from '../database/connections';
import convertHourToMinutes from '../utils/convertHourToMinutes';
import { Request, Response } from 'express';

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
			.join('authusers', 'classes.authuser_id', '=', 'authusers.id')
			.select([
				'classes.*',
				'authusers.name',
				'authusers.lastname',
				'authusers.email',
				'authusers.avatar',
				'authusers.bio',
				'authusers.whatsapp',
			]);

		return res.json(classes);
	}

	async createClass(req: Request, res: Response) {
		const { subject, cost, scheudle } = req.body;

		const trx = await db.transaction();

		const authuser = await trx('authusers')
			.first('*')
			.where({ id: req.userId });

		try {
			const insertedClassesIds = await trx('classes').insert({
				subject,
				cost,
				authuser_id: authuser.id,
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

	async deleteClass(req: Request, res: Response) {
		try {
			const authuser_id = req.userId;

			const classes = await db('classes').where({ authuser_id });

			const classScheudles = classes.map(async (myclass) => {
				const classxd = await db('class_scheudle')
					.first('*')
					.where({ class_id: myclass.id });
				console.log(classxd);
			});
			/*const classScheudles = await db('class_scheudle')
				.first('*')
				.where({ class_id: classes.id });*/

			console.log(classes);
			return res.status(200);
		} catch (e) {
			console.log(e);
		}
	}
}
