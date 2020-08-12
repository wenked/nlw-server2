import { Request, Response, NextFunction, response } from 'express';
import jwt from 'jsonwebtoken';
import db from '../database/connections';

// interface authRequest extends Request {
// 	auth: object | string;
// }

declare global {
	namespace Express {
		interface Request {
			userId: number;
		}
	}
}

interface userPayload {
	user: number;
	name: string;
	lastname: string;
	email: string;
}

export const authenticateToken = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const authHeader = req.headers.authorization;

	if (!authHeader) {
		return response.status(401).json({ message: 'Token is required' });
	}

	const [, token] = authHeader.split(' ');

	try {
		const payload = (await jwt.verify(token, 'secret')) as userPayload;
		req.userId = payload.user;
		console.log(req.userId);
		return next();
	} catch (e) {
		next(e);
		return response.status(401).json({ message: 'Invalid token' });
	}
};
