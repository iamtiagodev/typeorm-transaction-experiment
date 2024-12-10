import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {initializeTransactionalContext, StorageDriver} from "typeorm-transactional";

async function bootstrap() {

  initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });

  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
