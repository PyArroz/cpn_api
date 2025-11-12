import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MysqldbDataSource} from '../datasources';
import {Role, RoleRelations} from '../models';

export class RoleRepository extends DefaultCrudRepository<
  Role,
  typeof Role.prototype.id,
  RoleRelations
> {
  constructor(
    @inject('datasources.mysqldb') dataSource: MysqldbDataSource,
  ) {
    super(Role, dataSource);
  }
}
