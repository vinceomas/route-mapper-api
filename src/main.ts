import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ transform: true}))
  app.enableCors();

  const config = new DocumentBuilder()
  .setTitle('Route Mapper API')
  .setDescription('Route Mapper API')
  .setVersion('1.0')
  .addTag('routeMapper')
  .addBearerAuth()
  .build();
  const document = SwaggerModule.createDocument(app, config);

  const options = new DocumentBuilder().addBearerAuth();

  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
