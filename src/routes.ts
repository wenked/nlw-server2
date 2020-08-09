import express, { response } from 'express';
import ClassesController from './controllers/ClassesController';
import ConnectionController from './controllers/ConnectionsController';

const routes = express.Router();
const classesControler = new ClassesController();
const connectionsController = new ConnectionController();

routes.post('/classes', classesControler.create);
routes.get('/classes', classesControler.index);
routes.post('/connections', connectionsController.create);
routes.get('/connections', connectionsController.index);

export default routes;
