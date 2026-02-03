import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, HasManyRepositoryFactory, repository} from '@loopback/repository';
import {MysqldbDataSource} from '../datasources';
import {OwnedPackage, Role, User, UserAccess, UserRelations} from '../models';
import {OwnedPackageRepository} from './owned-package.repository';
import {RoleRepository} from './role.repository';
import {UserAccessRepository} from './user-access.repository';

export class UserRepository extends DefaultCrudRepository<
  User,
  typeof User.prototype.id,
  UserRelations
> {

  public readonly role: BelongsToAccessor<Role, typeof User.prototype.id>;

  public readonly userAccesses: HasManyRepositoryFactory<UserAccess, typeof User.prototype.id>;

  public readonly ownedPackages: HasManyRepositoryFactory<OwnedPackage, typeof User.prototype.id>;

  constructor(
    @inject('datasources.mysqldb') dataSource: MysqldbDataSource, @repository.getter('RoleRepository') protected roleRepositoryGetter: Getter<RoleRepository>, @repository.getter('UserAccessRepository') protected userAccessRepositoryGetter: Getter<UserAccessRepository>, @repository.getter('OwnedPackageRepository') protected ownedPackageRepositoryGetter: Getter<OwnedPackageRepository>,
  ) {
    super(User, dataSource);
    this.ownedPackages = this.createHasManyRepositoryFactoryFor('ownedPackages', ownedPackageRepositoryGetter);
    this.registerInclusionResolver('ownedPackages', this.ownedPackages.inclusionResolver);
    this.userAccesses = this.createHasManyRepositoryFactoryFor('userAccesses', userAccessRepositoryGetter,);
    this.registerInclusionResolver('userAccesses', this.userAccesses.inclusionResolver);
    this.role = this.createBelongsToAccessorFor('role', roleRepositoryGetter,);
    this.registerInclusionResolver('role', this.role.inclusionResolver);
  }
}
