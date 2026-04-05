import express, { Router } from 'express';
import { ZktecoController } from '@/controllers/zkteco.controller';

// Device-facing routes: DO NOT require auth.
const deviceRouter = Router();

// Some ZKTeco firmwares post text/plain; capture it here.
deviceRouter.use(
  express.text({
    type: ['text/*', 'application/octet-stream'],
    limit: '2mb',
  })
);

deviceRouter.get('/getrequest', ZktecoController.getRequest);
deviceRouter.post('/cdata', ZktecoController.postCdata);

// API routes (for admins/tools). You can add auth middleware here if desired.
export const zktecoApiRoutes = Router();
zktecoApiRoutes.get('/attendance-logs', ZktecoController.getAttendanceLogs);
zktecoApiRoutes.post('/pull-attendance', ZktecoController.queuePullAttendance);

export default deviceRouter;
