import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, HasManyRepositoryFactory} from '@loopback/repository';
import {MysqldbDataSource} from '../datasources';
import {Headquarter, HeadquarterRelations, Office, HeadquarterFee} from '../models';
import {OfficeRepository} from './office.repository';
import {HeadquarterFeeRepository} from './headquarter-fee.repository';

export class HeadquarterRepository extends DefaultCrudRepository<
  Headquarter,
  typeof Headquarter.prototype.id,
  HeadquarterRelations
> {

  public readonly offices: HasManyRepositoryFactory<Office, typeof Headquarter.prototype.id>;

  public readonly headquarterFees: HasManyRepositoryFactory<HeadquarterFee, typeof Headquarter.prototype.id>;

  constructor(
    @inject('datasources.mysqldb') dataSource: MysqldbDataSource, @repository.getter('OfficeRepository') protected officeRepositoryGetter: Getter<OfficeRepository>, @repository.getter('HeadquarterFeeRepository') protected headquarterFeeRepositoryGetter: Getter<HeadquarterFeeRepository>,
  ) {
    super(Headquarter, dataSource);
    this.headquarterFees = this.createHasManyRepositoryFactoryFor('headquarterFees', headquarterFeeRepositoryGetter,);
    this.registerInclusionResolver('headquarterFees', this.headquarterFees.inclusionResolver);
    this.offices = this.createHasManyRepositoryFactoryFor('offices', officeRepositoryGetter,);
    this.registerInclusionResolver('offices', this.offices.inclusionResolver);
  }
}
