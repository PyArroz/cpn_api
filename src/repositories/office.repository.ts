import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, HasManyRepositoryFactory, HasOneRepositoryFactory, repository} from '@loopback/repository';
import {MysqldbDataSource} from '../datasources';
import {Consultation, File, Headquarter, Office, OfficeRelations} from '../models';
import {ConsultationRepository} from './consultation.repository';
import {FileRepository} from './file.repository';
import {HeadquarterRepository} from './headquarter.repository';

export class OfficeRepository extends DefaultCrudRepository<
  Office,
  typeof Office.prototype.id,
  OfficeRelations
> {

  public readonly headquarter: BelongsToAccessor<Headquarter, typeof Office.prototype.id>;

  public readonly consultations: HasManyRepositoryFactory<Consultation, typeof Office.prototype.id>;

  public readonly image: HasOneRepositoryFactory<File, typeof Office.prototype.id>;

  constructor(
    @inject('datasources.mysqldb') dataSource: MysqldbDataSource, @repository.getter('HeadquarterRepository') protected headquarterRepositoryGetter: Getter<HeadquarterRepository>, @repository.getter('ConsultationRepository') protected consultationRepositoryGetter: Getter<ConsultationRepository>, @repository.getter('FileRepository') protected fileRepositoryGetter: Getter<FileRepository>,
  ) {
    super(Office, dataSource);
    this.image = this.createHasOneRepositoryFactoryFor('image', fileRepositoryGetter);
    this.registerInclusionResolver('image', this.image.inclusionResolver);
    this.consultations = this.createHasManyRepositoryFactoryFor('consultations', consultationRepositoryGetter,);
    this.registerInclusionResolver('consultations', this.consultations.inclusionResolver);
    this.headquarter = this.createBelongsToAccessorFor('headquarter', headquarterRepositoryGetter,);
    this.registerInclusionResolver('headquarter', this.headquarter.inclusionResolver);
  }
}
