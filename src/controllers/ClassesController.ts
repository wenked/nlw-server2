import db from '../database/connections';
import convertHourToMinutes from '../utils/convertHourToMinutes';
import { Request, Response, response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

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

	async createAuthuser(req: Request, res: Response) {
		const { name, lastname, email, password } = req.body;

		const trx = await db.transaction();

		try {
			const hash = await bcrypt.hash(password, 10);
			await trx('authusers').insert({
				name,
				lastname,
				email,
				password: hash,
			});
			await trx.commit();

			return res.status(201).send({
				name,
				lastname,
				email,
			});
		} catch (e) {
			console.log(e);
			await trx.rollback();
			return res.status(500).send('something broke');
		}
	}

	async login(req: Request, res: Response) {
		const { email, password } = req.body;

		try {
			const user = await db('authusers').first('*').where({ email });
			if (user) {
				const validPass = await bcrypt.compare(password, user.password);
				if (validPass) {
					return res.status(200).json({
						user: {
							id: user.id,
							name: user.name,
							lastname: user.lastname,
							email: user.email,
						},
						token: jwt.sign({ user: user.id }, 'secret', {
							expiresIn: 86400,
						}),
					});
				} else {
					return res.json('errado');
				}
			} else {
				return res.status(400).json('user not found');
			}
		} catch (e) {
			console.log(e);
			return res.status(500).send('Something broke');
		}
	}

	async me(req: Request, res: Response) {
		try {
			const user = await db('authusers').first('*').where({ id: req.userId });
			console.log(user);
			return res.json({
				user: {
					id: user.id,
					name: user.name,
					lastname: user.lastname,
					email: user.email,
				},
			});
		} catch (e) {
			return res.status(400).json({ error: 'cant get user authentication' });
		}
	}
}
