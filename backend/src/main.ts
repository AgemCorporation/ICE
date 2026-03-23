import * as dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // Disable built-in parser so we can set a custom limit
  });

  // Increase JSON body limit to support base64 photo uploads from mobile app
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Enable CORS for Angular frontend (restricted origins)
  app.enableCors({
    origin: true, // Allow all domains to connect dynamically
    credentials: true,
  });

  // Global validation pipe — validates incoming request bodies
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,            // Strip properties not in DTO
    forbidNonWhitelisted: false, // Don't block unknown fields (gradual DTO adoption)
    transform: true,            // Auto-transform payloads to DTO instances
    skipMissingProperties: true, // Allow partial updates (PATCH)
  }));

  // Set global prefix to '/api'
  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT ?? 36864, '0.0.0.0');
}
bootstrap();

