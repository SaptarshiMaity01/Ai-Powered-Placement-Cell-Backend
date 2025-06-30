// validation/studentValidation.js
import { body } from 'express-validator';

 const validateRequest = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),

  body('email')
    .optional()
    .isEmail().withMessage('Must be a valid email'),

  body('department')
    .optional()
    .trim(),

  body('isActive')
    .optional()
    .isBoolean().withMessage('Must be a boolean value')
];
export default validateRequest
