import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {MysqldbDataSource} from '../datasources';
import {Consultation, ConsultationRelations, Office, User} from '../models';
import {OfficeRepository} from './office.repository';
import {UserRepository} from './user.repository';

export class ConsultationRepository extends DefaultCrudRepository<
  Consultation,
  typeof Consultation.prototype.id,
  ConsultationRelations
> {

  public readonly office: BelongsToAccessor<Office, typeof Consultation.prototype.id>;

  public readonly user: BelongsToAccessor<User, typeof Consultation.prototype.id>;

  constructor(
    @inject('datasources.mysqldb') dataSource: MysqldbDataSource, @repository.getter('OfficeRepository') protected officeRepositoryGetter: Getter<OfficeRepository>, @repository.getter('UserRepository') protected userRepositoryGetter: Getter<UserRepository>,
  ) {
    super(Consultation, dataSource);
    this.user = this.createBelongsToAccessorFor('user', userRepositoryGetter,);
    this.registerInclusionResolver('user', this.user.inclusionResolver);
    this.office = this.createBelongsToAccessorFor('office', officeRepositoryGetter,);
    this.registerInclusionResolver('office', this.office.inclusionResolver);
  }
}
