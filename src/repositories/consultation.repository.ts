import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MysqldbDataSource} from '../datasources';
import {Consultation, ConsultationRelations} from '../models';

export class ConsultationRepository extends DefaultCrudRepository<
  Consultation,
  typeof Consultation.prototype.id,
  ConsultationRelations
> {
  constructor(
    @inject('datasources.mysqldb') dataSource: MysqldbDataSource,
  ) {
    super(Consultation, dataSource);
  }
}
