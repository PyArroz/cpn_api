import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {MysqldbDataSource} from '../datasources';
import {User, UserRelations, Role} from '../models';
import {RoleRepository} from './role.repository';

export class UserRepository extends DefaultCrudRepository<
  User,
  typeof User.prototype.id,
  UserRelations
> {

  public readonly role: BelongsToAccessor<Role, typeof User.prototype.id>;

  constructor(
    @inject('datasources.mysqldb') dataSource: MysqldbDataSource, @repository.getter('RoleRepository') protected roleRepositoryGetter: Getter<RoleRepository>,
  ) {
    super(User, dataSource);
    this.role = this.createBelongsToAccessorFor('role', roleRepositoryGetter,);
    this.registerInclusionResolver('role', this.role.inclusionResolver);
  }
}
