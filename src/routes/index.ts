import {Router} from 'express';

import v1Routes from './v1';

const router = Router();

// Version 1 of the API
router.use('/v1', v1Routes);

export default router;
