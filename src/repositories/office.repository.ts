import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor, HasManyRepositoryFactory} from '@loopback/repository';
import {MysqldbDataSource} from '../datasources';
import {Office, OfficeRelations, Headquarter, Consultation} from '../models';
import {HeadquarterRepository} from './headquarter.repository';
import {ConsultationRepository} from './consultation.repository';

export class OfficeRepository extends DefaultCrudRepository<
  Office,
  typeof Office.prototype.id,
  OfficeRelations
> {

  public readonly headquarter: BelongsToAccessor<Headquarter, typeof Office.prototype.id>;

  public readonly consultations: HasManyRepositoryFactory<Consultation, typeof Office.prototype.id>;

  constructor(
    @inject('datasources.mysqldb') dataSource: MysqldbDataSource, @repository.getter('HeadquarterRepository') protected headquarterRepositoryGetter: Getter<HeadquarterRepository>, @repository.getter('ConsultationRepository') protected consultationRepositoryGetter: Getter<ConsultationRepository>,
  ) {
    super(Office, dataSource);
    this.consultations = this.createHasManyRepositoryFactoryFor('consultations', consultationRepositoryGetter,);
    this.registerInclusionResolver('consultations', this.consultations.inclusionResolver);
    this.headquarter = this.createBelongsToAccessorFor('headquarter', headquarterRepositoryGetter,);
    this.registerInclusionResolver('headquarter', this.headquarter.inclusionResolver);
  }
}
