import db from '../database/connections';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mailgun from 'mailgun-js';
import { Request, Response } from 'express';

const DOMAIN = 'sandbox08b262434e1b4350b353d5e7fc6a6dce.mailgun.org';
const mg = mailgun({
	apiKey: 'e4c59f7c2d6758f0802f862e982a1e32-07e45e2a-f61be2a7',
	domain: DOMAIN,
});

export default class UserController {
	async createAuthuser(req: Request, res: Response) {
		const { name, lastname, email, password, avatar, whatsapp, bio } = req.body;

		const trx = await db.transaction();

		try {
			const hash = await bcrypt.hash(password, 10);
			await trx('authusers').insert({
				name,
				lastname,
				email,
				password: hash,
				avatar,
				whatsapp,
				bio,
			});
			await trx.commit();

			return res.status(201).send({
				name,
				lastname,
				email,
				whatsapp,
				avatar,
				bio,
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
							whatsapp: user.whatsapp,
							avatar: user.avatar,
							bio: user.bio,
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

			return res.json({
				user: {
					id: user.id,
					name: user.name,
					lastname: user.lastname,
					email: user.email,
					whatsapp: user.whatsapp,
					avatar: user.avatar,
					bio: user.bio,
				},
			});
		} catch (e) {
			return res.status(400).json({ error: 'cant get user authentication' });
		}
	}

	async forgotPassword(req: Request, res: Response) {
		const { email } = req.body;

		try {
			const user = await db('authusers').first('*').where({ email });

			const token = jwt.sign({ id: user.id }, 'secret2', { expiresIn: '30m' });
			const data = {
				from: 'Excited User <me@samples.mailgun.org>',
				to: email,
				subject: 'Hello',
				text: 'Testing some Mailgun awesomness!',
				html: `<a href='http://localhost:3000/resetpassword/${token}'>Recupere a senha</a>`,
			};

			await db('authusers')
				.first('*')
				.where({ email })
				.update({ resetpasswordlink: token });

			mg.messages().send(data, function (err, body) {
				if (err) {
					return res.json({ error: err.message });
				}
				return res.json({ message: 'Email sended' });
			});
		} catch (e) {
			console.log(e);
			return res.status(400).json({ error: 'user dont exist' });
		}
	}

	async resetPassword(req: Request, res: Response) {
		const { email, password, token } = req.body;

		try {
			const user = await db('authusers').first('*').where({ email });

			if (!user) {
				return res.status(400).json({ err: 'user not found' });
			}

			if (token !== user.resetpasswordlink) {
				return res.sendStatus(400).json({ err: 'Invalid token' });
			}

			const hash = await bcrypt.hash(password, 10);
			await db('authusers')
				.first('*')
				.where({ email })
				.update({ password: hash });
			return res.send();
		} catch (err) {
			res.status(400).send({ error: 'Cannot reset password try again' });
		}
	}

	async updateUser(req: Request, res: Response) {
		const { email, whatsapp, bio, avatar, lastname, name } = req.body;
		const id = req.userId;

		try {
			const user = await db('authusers').first('*').where({ id });
			if (!user) {
				return res.status(400).json({ err: 'user not found' });
			}

			if (email) {
				await db('authusers').first('*').where({ id }).update({ email });
			}

			if (whatsapp) {
				await db('authusers').first('*').where({ id }).update({ whatsapp });
			}

			if (bio) {
				await db('authusers').first('*').where({ id }).update({ bio });
			}

			if (name) {
				await db('authusers').first('*').where({ id }).update({ name });
			}

			if (lastname) {
				await db('authusers').first('*').where({ id }).update({ lastname });
			}

			if (avatar) {
				console.log(avatar);
				await db('authusers').first('*').where({ id }).update({ avatar });
			}

			return res.send('Update finished');
		} catch (e) {
			console.log(e);
			res.status(400).send({ error: 'cannot change info' });
		}
	}
}
