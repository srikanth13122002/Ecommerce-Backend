import Joi from 'joi';

export const envValidationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  MONGODB_URI: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  STRIPE_SECRET_KEY: Joi.string().required(),
  STRIPE_WEBHOOK_SECRET: Joi.string().allow('').default(''),
  STRIPE_SUCCESS_URL: Joi.string().uri().required(),
  STRIPE_CANCEL_URL: Joi.string().uri().required(),
  CORS_ORIGIN: Joi.string().default('http://localhost:5173'),
  UPLOAD_DIR: Joi.string().default('./uploads'),
  ADMIN_EMAIL: Joi.string().email().default('admin@store.com'),
  ADMIN_PASSWORD: Joi.string().default('Admin@123'),
});
