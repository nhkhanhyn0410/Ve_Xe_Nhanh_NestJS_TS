import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import Joi from 'joi';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number(),
        MONGODB_URI: Joi.string().required(),
        REDIS_HOST: Joi.string(),
        REDIS_PORT: Joi.number(),
        JWT_SECRET: Joi.string().min(32).required(),
        JWT_ACCESS_EXPIRES: Joi.string(),
        JWT_REFRESH_EXPIRES: Joi.string(),
        ALLOWED_ORIGINS: Joi.string(),
        THROTTLE_TTL: Joi.number(),
        THROTTLE_LIMIT: Joi.number(),
      }),
    }),
  ],
})
export class AppConfigModule {}
