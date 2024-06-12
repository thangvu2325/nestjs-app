import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import 'dotenv/config';
import { CoapService } from './coap/coap.service';
import { HttpExceptionFilter } from './http-exception.filter';
import * as helmet from 'helmet';

async function bootstrap() {
  const port = process.env.PORT;

  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new HttpExceptionFilter());
  const config = new DocumentBuilder()
    .setTitle('IoT Server')
    .setDescription('Server IOT Coap build from NestJs')
    .setVersion('1.0')
    .addTag('API ENDPOINT')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Enter JWT token',
      in: 'header',
    })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.useGlobalPipes(new ValidationPipe());
  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'wasm-unsafe-eval'",
          "'inline-speculation-rules'",
          "'sha256-1toisMNYvYWodONOyE5++VEBb/6Vr81HRsoNrC+5/qI='",
        ],
        // Thêm các chỉ thị khác nếu cần
      },
    }),
  );
  // Enable CORS so we can access the application from a different origin
  app.enableCors({
    origin: '*',
  });

  // Start the application
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  await app.listen(port).then((_value) => {
    console.log(`Server started at Port ${port}`);
  });
  const coapService = app.get(CoapService);
  coapService.startServer();
  coapService.sendRequest();
}
bootstrap();
