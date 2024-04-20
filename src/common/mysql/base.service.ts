import { FindOneOptions, Repository } from 'typeorm';
import { BaseEntity } from './base.entity';
import { plainToInstance } from 'class-transformer';
export class MysqlBaseService<Entity extends BaseEntity, Dto> {
  constructor(
    protected repo: Repository<Entity>,
    private dtoClass: new () => Dto,
  ) {
    this.dtoClass = dtoClass; // Gán giá trị cho biến
  }
  async save(dataDto: Dto): Promise<Dto[]> {
    // Create an entity instance using the repository's create method
    const entityInstance = this.repo.create(dataDto as any);
    // Save the entity, triggering BeforeInsert hook
    const savedData = await this.repo.save(entityInstance);
    // Convert the saved data to DTO
    return plainToInstance(
      this.dtoClass,
      { ...savedData },
      {
        excludeExtraneousValues: true,
      },
    );
  }

  async update(id: string, dataDto: Dto): Promise<{ result: string }> {
    await this.repo.update(id, dataDto as any);
    return { result: 'success' };
  }
  // async findOne(id: string): Promise<any> {
  //   const foundedData = await this.repo.findOne({
  //     where: {
  //       id: id as any,
  //     },
  //   });
  //   if (foundedData === null) {
  //     // return {};
  //   }
  //   return plainToInstance(this.dtoClass, foundedData, {
  //     excludeExtraneousValues: true,
  //   });
  // }
  async findOne(where: FindOneOptions<Entity>): Promise<Entity> {
    const post = await this.repo.findOne(where);
    return post;
  }
  async deleteById(id: string): Promise<{ result: string }> {
    await this.repo.softDelete(id);
    return { result: 'success' };
  }
}
