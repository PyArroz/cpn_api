import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {MysqldbDataSource} from '../datasources';
import {Office, OfficeRelations, Headquarter} from '../models';
import {HeadquarterRepository} from './headquarter.repository';

export class OfficeRepository extends DefaultCrudRepository<
  Office,
  typeof Office.prototype.id,
  OfficeRelations
> {

  public readonly headquarter: BelongsToAccessor<Headquarter, typeof Office.prototype.id>;

  constructor(
    @inject('datasources.mysqldb') dataSource: MysqldbDataSource, @repository.getter('HeadquarterRepository') protected headquarterRepositoryGetter: Getter<HeadquarterRepository>,
  ) {
    super(Office, dataSource);
    this.headquarter = this.createBelongsToAccessorFor('headquarter', headquarterRepositoryGetter,);
    this.registerInclusionResolver('headquarter', this.headquarter.inclusionResolver);
  }
}
