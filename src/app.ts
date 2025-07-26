import express from 'express';
import morgan from 'morgan';
import errorHandler from './middleware/errorHandler';
import apiRoutes from './routes';
import {logger} from './utils/logger';

const app = express();

app.use(express.json());

const isProduction = process.env.NODE_ENV === 'production';

app.use(
  morgan(isProduction ? 'combined' : 'dev', {
    stream: {
      write: message => logger.http(message.trim()),
    },
  }),
);

app.use('/api', apiRoutes);

app.use(errorHandler);

export default app;
