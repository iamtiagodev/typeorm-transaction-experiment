import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DataSource, DataSourceOptions } from 'typeorm';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { Pokemon } from './entities/Pokemon';

const dataSourceOptions = {
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'root',
  password: 'root',
  database: 'db',
  entities: [Pokemon],
  synchronize: true,
  logging: true,
};

export const dataSource = new DataSource({ ...dataSourceOptions } as DataSourceOptions);

@Module({
  imports: [TypeOrmModule.forRootAsync({
      useFactory() {
        return dataSourceOptions as TypeOrmModuleOptions;
      },
      async dataSourceFactory(options) {
        if (!options) {
          throw new Error('Invalid options passed');
        }
        return addTransactionalDataSource(new DataSource(options));
      },
    },
  ),
    TypeOrmModule.forFeature([Pokemon]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor() {
  }
}
