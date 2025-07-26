import express from 'express';
import morgan from 'morgan';
import errorHandler from './middleware/errorHandler';
import apiRoutes from './routes';

const app = express();

app.use(express.json());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use('/api', apiRoutes);

app.use(errorHandler);

export default app;
