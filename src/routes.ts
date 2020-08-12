import express, { response } from 'express';
import ClassesController from './controllers/ClassesController';
import ConnectionController from './controllers/ConnectionsController';
import { authenticateToken } from './middlewares/auth';

const routes = express.Router();
const classesControler = new ClassesController();
const connectionsController = new ConnectionController();

routes.post('/classes', classesControler.create);
routes.get('/classes', classesControler.index);
routes.post('/connections', connectionsController.create);
routes.get('/connections', connectionsController.index);
routes.post('/register', classesControler.createAuthuser);
routes.post('/login', classesControler.login);
routes.get('/me', authenticateToken, classesControler.me);

export default routes;
