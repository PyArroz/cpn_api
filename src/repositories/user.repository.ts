import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor, HasManyRepositoryFactory} from '@loopback/repository';
import {MysqldbDataSource} from '../datasources';
import {User, UserRelations, Role, UserAccess} from '../models';
import {RoleRepository} from './role.repository';
import {UserAccessRepository} from './user-access.repository';

export class UserRepository extends DefaultCrudRepository<
  User,
  typeof User.prototype.id,
  UserRelations
> {

  public readonly role: BelongsToAccessor<Role, typeof User.prototype.id>;

  public readonly userAccesses: HasManyRepositoryFactory<UserAccess, typeof User.prototype.id>;

  constructor(
    @inject('datasources.mysqldb') dataSource: MysqldbDataSource, @repository.getter('RoleRepository') protected roleRepositoryGetter: Getter<RoleRepository>, @repository.getter('UserAccessRepository') protected userAccessRepositoryGetter: Getter<UserAccessRepository>,
  ) {
    super(User, dataSource);
    this.userAccesses = this.createHasManyRepositoryFactoryFor('userAccesses', userAccessRepositoryGetter,);
    this.registerInclusionResolver('userAccesses', this.userAccesses.inclusionResolver);
    this.role = this.createBelongsToAccessorFor('role', roleRepositoryGetter,);
    this.registerInclusionResolver('role', this.role.inclusionResolver);
  }
}
