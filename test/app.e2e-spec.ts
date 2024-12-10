import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule, dataSource } from '../src/app.module';
import { initializeTransactionalContext, StorageDriver } from 'typeorm-transactional';
import { DataSource, Repository } from 'typeorm';
import { Pokemon } from '../src/entities/Pokemon';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let bRepository: Repository<Pokemon>;

  beforeAll(async () => {
    await dataSource.initialize();
    initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    bRepository = app.get(DataSource).getRepository(Pokemon);
    await app.init();
  })

  afterEach(async () => {
    await bRepository.clear();
  })

  afterAll(async () => {
    await bRepository.clear();
    await dataSource.destroy();
    await app.close();
  })

  describe('Fail Path - Failed to rollback', () => {
    it('v1 - Promise.all + @Transactional', async () => {
      await request(app.getHttpServer())
        .post('/version/1')
        .expect(500);
      expect(await bRepository.find()).toEqual([]);
      expect(await bRepository.count()).toEqual(0);
    });

    it('v2 - Promise.all + EntityManager', async () => {
      await request(app.getHttpServer())
        .post('/version/2')
        .expect(500);

      // because we don't wait for all promise resolutions while using Promise.all
      // some operations could happen under the hood and after other tests
      await new Promise((r) => setTimeout(r, 50));
      expect(await bRepository.find()).toEqual([]);
      expect(await bRepository.count()).toEqual(0);
    });
  })

  describe('Happy Path - No new records', () => {
    it('v3 - `await` each call', async () => {
      await request(app.getHttpServer())
        .post('/version/3')
        .expect(500);
      expect(await bRepository.find()).toEqual([]);
      expect(await bRepository.count()).toEqual(0);
    });

    it('v4 - Promise.allSettled + @Transactional', async () => {
      await request(app.getHttpServer())
        .post('/version/4')
        .expect(500);
      expect(await bRepository.find()).toEqual([]);
      expect(await bRepository.count()).toEqual(0);
    });

    it('v5 - Promise.allSettled + native transaction', async () => {
      await request(app.getHttpServer())
        .post('/version/5')
        .expect(500);
      expect(await bRepository.find()).toEqual([]);
      expect(await bRepository.count()).toEqual(0);
    });
  })
});
