import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {MysqldbDataSource} from '../datasources';
import {UserAccess, UserAccessRelations, User, Headquarter} from '../models';
import {UserRepository} from './user.repository';
import {HeadquarterRepository} from './headquarter.repository';

export class UserAccessRepository extends DefaultCrudRepository<
  UserAccess,
  typeof UserAccess.prototype.id,
  UserAccessRelations
> {

  public readonly user: BelongsToAccessor<User, typeof UserAccess.prototype.id>;

  public readonly headquarter: BelongsToAccessor<Headquarter, typeof UserAccess.prototype.id>;

  constructor(
    @inject('datasources.mysqldb') dataSource: MysqldbDataSource, @repository.getter('UserRepository') protected userRepositoryGetter: Getter<UserRepository>, @repository.getter('HeadquarterRepository') protected headquarterRepositoryGetter: Getter<HeadquarterRepository>,
  ) {
    super(UserAccess, dataSource);
    this.headquarter = this.createBelongsToAccessorFor('headquarter', headquarterRepositoryGetter,);
    this.registerInclusionResolver('headquarter', this.headquarter.inclusionResolver);
    this.user = this.createBelongsToAccessorFor('user', userRepositoryGetter,);
    this.registerInclusionResolver('user', this.user.inclusionResolver);
  }
}
