import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, HasManyRepositoryFactory} from '@loopback/repository';
import {MysqldbDataSource} from '../datasources';
import {Headquarter, HeadquarterRelations, Office} from '../models';
import {OfficeRepository} from './office.repository';

export class HeadquarterRepository extends DefaultCrudRepository<
  Headquarter,
  typeof Headquarter.prototype.id,
  HeadquarterRelations
> {

  public readonly offices: HasManyRepositoryFactory<Office, typeof Headquarter.prototype.id>;

  constructor(
    @inject('datasources.mysqldb') dataSource: MysqldbDataSource, @repository.getter('OfficeRepository') protected officeRepositoryGetter: Getter<OfficeRepository>,
  ) {
    super(Headquarter, dataSource);
    this.offices = this.createHasManyRepositoryFactoryFor('offices', officeRepositoryGetter,);
    this.registerInclusionResolver('offices', this.offices.inclusionResolver);
  }
}
