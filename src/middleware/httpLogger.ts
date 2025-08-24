import morgan from 'morgan';

import env from '~config/env.config';

import {logger} from '~utils/logger';

const stream = {
  write: (message: string) => {
    // Remove the trailing newline that morgan adds
    logger.info(message.trim());
  },
};

export const httpLogger = morgan(
  ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms',
  {stream},
);

export const detailedHttpLogger = morgan(
  ':method :url :status :response-time ms - :res[content-length]',
  {
    stream,
    skip: (req, res) => {
      // Skip successful requests in production
      return env.NODE_ENV === 'production' && res.statusCode < 400;
    },
  },
);
