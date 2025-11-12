import {
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {
  Consultation,
  Office,
} from '../models';
import {ConsultationRepository} from '../repositories';

export class ConsultationOfficeController {
  constructor(
    @repository(ConsultationRepository)
    public consultationRepository: ConsultationRepository,
  ) { }

  @get('/consultations/{id}/office', {
    responses: {
      '200': {
        description: 'Office belonging to Consultation',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Office),
          },
        },
      },
    },
  })
  async getOffice(
    @param.path.number('id') id: typeof Consultation.prototype.id,
  ): Promise<Office> {
    return this.consultationRepository.office(id);
  }
}
