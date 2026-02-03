import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MysqldbDataSource} from '../datasources';
import {Package, PackageRelations} from '../models';

export class PackageRepository extends DefaultCrudRepository<
  Package,
  typeof Package.prototype.id,
  PackageRelations
> {
  constructor(
    @inject('datasources.mysqldb') dataSource: MysqldbDataSource,
  ) {
    super(Package, dataSource);
  }
}
