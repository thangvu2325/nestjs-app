import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import 'dotenv/config';
import { CoapService } from './coap/coap.service';
import { HttpExceptionFilter } from './http-exception.filter';

async function bootstrap() {
  const port = process.env.NESTJS_APP_DOCKER_PORT;

  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new HttpExceptionFilter());
  const config = new DocumentBuilder()
    .setTitle('IoT Server')
    .setDescription('Server IOT Coap build from NestJs')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.useGlobalPipes(new ValidationPipe());

  // Enable CORS so we can access the application from a different origin
  app.enableCors({
    origin: '*',
  });

  // Start the application
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  await app.listen(port).then((_value) => {
    console.log(`Server started at http://localhost:${port}`);
  });
  const coapService = app.get(CoapService);
  coapService.startServer();
  coapService.sendRequest();
  // This is necessary to make the hot-reload work with Docker
}
bootstrap();
