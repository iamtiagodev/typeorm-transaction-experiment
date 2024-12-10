import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { Pokemon } from './entities/Pokemon';
import { dataSource } from './app.module';

const throwError = true;

@Injectable()
export class AppService {

  constructor(
    @InjectRepository(Pokemon)
    private bRepository: Repository<Pokemon>) {
    if (!dataSource.isInitialized) {
      dataSource.initialize();
    }
  }

  async save(entity: Pokemon, throwError = false): Promise<Pokemon> {
    if (throwError) {
      throw new Error('Unexpected error...');
    }
    return this.bRepository.save(entity);
  }

  async saveEntityManager(entityManager: EntityManager, entity: Pokemon, throwError = false): Promise<Pokemon> {
    if (throwError) {
      throw new Error('Unexpected error...');
    }
    const b = new Pokemon();
    b.id = entity.id;
    b.name = entity.name;
    return entityManager.save(b);
  }

  // ❌ Promise.all + typeorm-transactional
  @Transactional()
  async createV1() {
    await Promise.all([
      this.save({ id: 1, name: 'Bulbasaur' }),
      this.save({ id: 2, name: 'Charmander' }),
      this.save({ id: 3, name: 'Squirtle' }),
      this.save({ id: 4, name: 'Pikachu' }, throwError),
    ]);
  }

  // ❌ Promise.all + typeorm native transaction
  async createV2(): Promise<void> {
    await dataSource.transaction(async (entityManager) => {
      await Promise.all([
        this.saveEntityManager(entityManager, { id: 23, name: 'Bulbasaur' }, throwError),
        this.saveEntityManager(entityManager, { id: 20, name: 'Charmander' }),
        this.saveEntityManager(entityManager, { id: 21, name: 'Squirtle' }),
        this.saveEntityManager(entityManager, { id: 22, name: 'Pikachu' }),
      ]);
    });
  }

  // ✅ wait individually + typeorm-transactional
  @Transactional()
  async createV3(): Promise<void> {
    await this.save({ id: 1, name: 'Bulbasaur' });
    await this.save({ id: 2, name: 'Charmander' });
    await this.save({ id: 3, name: 'Squirtle' });
    await this.save({ id: 4, name: 'Pikachu' }, throwError);
  }



  // ✅ Promise.allSettled + typeorm-transactional
  @Transactional()
  async createV4(): Promise<void> {
    const promises = await Promise.allSettled([
      this.save({ id: 1, name: 'Bulbasaur' }),
      this.save({ id: 2, name: 'Charmander' }),
      this.save({ id: 3, name: 'Squirtle' }),
      this.save({ id: 4, name: 'Pikachu' }, throwError),
    ]);

    rejectOrResolve(promises);
  }


  // ✅ Promise.allSettled + typeorm native transaction
  async createV5(): Promise<void> {
    await dataSource.transaction(async (entityManager) => {
      const promises = await Promise.allSettled([
        this.saveEntityManager(entityManager, { id: 1, name: 'Bulbasaur' }),
        this.saveEntityManager(entityManager, { id: 2, name: 'Charmander' }),
        this.saveEntityManager(entityManager, { id: 3, name: 'Squirtle' }),
        this.saveEntityManager(entityManager, { id: 4, name: 'Pikachu' }, throwError),
      ]);
      rejectOrResolve(promises);
    });
  }

}

const rejectOrResolve = <T>(results: PromiseSettledResult<T>[]): T[] => {
  return results.map((result) => {
    if (result.status === 'rejected') {
      throw result.reason;
    }
    return result.value;
  });
};
