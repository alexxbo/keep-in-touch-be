import compression from 'compression';
import cors from 'cors';
import express, {Request, Response} from 'express';
import helmet from 'helmet';
import errorHandler from './middleware/errorHandler';
import {detailedHttpLogger, httpLogger} from './middleware/httpLogger';
import apiRoutes from './routes';
import {BaseError} from './utils/BaseError';

const app = express();

app.use(express.json({limit: '50mb'}));
app.use(helmet());
app.use(compression());
app.use(express.urlencoded({extended: true}));

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  app.use(
    cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || false,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: false,
    }),
  );
} else {
  app.use(cors());
}

// HTTP request logging
app.use(isProduction ? httpLogger : detailedHttpLogger);

//testing api
app.get('/test', (req: Request, res: Response) => {
  res.status(200).json({success: true, message: 'api is working'});
});

app.use('/api', apiRoutes);

app.use('/', (req, res, next) => {
  next(new BaseError(`Can't find ${req.method} ${req.originalUrl}`, 404));
});

app.use(errorHandler);

export default app;
