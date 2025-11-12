import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MysqldbDataSource} from '../datasources';
import {Headquarter, HeadquarterRelations} from '../models';

export class HeadquarterRepository extends DefaultCrudRepository<
  Headquarter,
  typeof Headquarter.prototype.id,
  HeadquarterRelations
> {
  constructor(
    @inject('datasources.mysqldb') dataSource: MysqldbDataSource,
  ) {
    super(Headquarter, dataSource);
  }
}
