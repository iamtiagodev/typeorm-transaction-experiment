import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource, Repository } from 'typeorm';
import { initializeTransactionalContext, StorageDriver } from 'typeorm-transactional';
import { AppModule, dataSource } from '../src/app.module';
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

  describe('Fail Path - Fails to rollback', () => {
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

  describe('Happy Path - Rollback properly ', () => {
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

  describe('Propagation - Promise.allSettled + @Transactional', () => {
    it.each(
      [
        ['v1 - Propagation.REQUIRED', '/version/4-1'],
        ['v2 - Propagation.MANDATORY', '/version/4-2'],
        ['v3 - Propagation.NESTED', '/version/4-3'],
        ['v4 - Propagation.REQUIRES_NEW', '/version/4-4'],
        ['v5 - Propagation.SUPPORTS', '/version/4-5'],
        ['v6 - Propagation.NOT_SUPPORTED', '/version/4-6'],
        ['v7 - Propagation.NEVER', '/version/4-7'],
      ]
    )('%s', async (_, url) => {
      await request(app.getHttpServer())
        .post(url)
        .expect(500);
      expect(await bRepository.find()).toEqual([]);
      expect(await bRepository.count()).toEqual(0);
    });
  })
});
