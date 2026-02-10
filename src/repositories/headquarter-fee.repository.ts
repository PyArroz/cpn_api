import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MysqldbDataSource} from '../datasources';
import {HeadquarterFee, HeadquarterFeeRelations} from '../models';

export class HeadquarterFeeRepository extends DefaultCrudRepository<
  HeadquarterFee,
  typeof HeadquarterFee.prototype.id,
  HeadquarterFeeRelations
> {
  constructor(
    @inject('datasources.mysqldb') dataSource: MysqldbDataSource,
  ) {
    super(HeadquarterFee, dataSource);
  }
}
