import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

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
		return res.status(401).json({ message: 'Token is required' });
	}

	const [, token] = authHeader.split(' ');
	console.log(token, 'aqui');

	try {
		const payload = jwt.verify(token, 'secret') as userPayload;
		req.userId = payload.user;
		console.log(req.userId, 'auth aqui');

		return next();
	} catch (e) {
		next(e);
		return res.status(401).json({ message: 'Invalid token' });
	}
};
