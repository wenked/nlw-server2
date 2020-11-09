import express, { response } from 'express';
import ClassesController from './controllers/ClassesController';
import ConnectionController from './controllers/ConnectionsController';
import { authenticateToken } from './middlewares/auth';
import UserController from './controllers/UsersController';

const routes = express.Router();
const classesControler = new ClassesController();
const connectionsController = new ConnectionController();
const usersController = new UserController();

routes.post('/classes', authenticateToken, classesControler.createClass);
routes.get('/classes', classesControler.index);
routes.get('/classesxd', authenticateToken, classesControler.deleteClass);
routes.post('/connections', connectionsController.create);
routes.get('/connections', connectionsController.index);
routes.post('/register', usersController.createAuthuser);
routes.post('/login', usersController.login);
routes.get('/me', authenticateToken, usersController.me);
routes.post('/forgotpassword', usersController.forgotPassword);
routes.post('/resetpassword', usersController.resetPassword);
routes.put('/updateuser', authenticateToken, usersController.updateUser);

export default routes;
