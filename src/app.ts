import bodyParser from 'body-parser';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import errorHandler, {BaseError} from './middleware/errorHandler';
import apiRoutes from './routes';
import {logger} from './utils/logger';

const app = express();

app.use(express.json());
app.use(bodyParser.json());
app.use(helmet());
app.use(compression());
app.use(express.urlencoded({extended: true}));

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  app.use(
    cors({
      origin: ['http://yourfrontend.com', 'https://yourfrontend.com'], // Replace with actual frontend URL(s)
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );
} else {
  app.use(cors());
}

app.use(
  morgan(isProduction ? 'combined' : 'dev', {
    stream: {
      write: message => logger.http(message.trim()),
    },
  }),
);

app.use('/api', apiRoutes);

app.use('/', (req, res, next) => {
  next(new BaseError(`Can't find ${req.method} ${req.originalUrl}`, 404));
});

app.use(errorHandler);

export default app;
