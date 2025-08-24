import {NextFunction, Request, Response} from 'express';
import {logger} from '~utils/logger';

/**
 * Middleware to update user's last seen timestamp
 */
export const updateLastSeen = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (req.user) {
      req.user.updateLastSeen();
      await req.user.save();
      logger.debug(
        `Updated last seen for user ${req.user.username} (${req.user._id})`,
      );
    }
    next();
  } catch (error) {
    // Don't fail the request if updating last seen fails
    logger.error('Error updating last seen:', error);
    next();
  }
};
