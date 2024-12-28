import { Router } from 'express';
import AuthController from '../controllers/authController.mjs';
import { validateRequest } from '../../../middleware/validationMiddleware.mjs';
import userValidationSchema from '../../../validation/userValidationSchema.mjs';

const router = Router();

router.post('/login', AuthController.login);
router.post('/register', userValidationSchema, validateRequest, AuthController.register);

export default router;
