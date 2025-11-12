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
  User,
} from '../models';
import {ConsultationRepository} from '../repositories';

export class ConsultationUserController {
  constructor(
    @repository(ConsultationRepository)
    public consultationRepository: ConsultationRepository,
  ) { }

  @get('/consultations/{id}/user', {
    responses: {
      '200': {
        description: 'User belonging to Consultation',
        content: {
          'application/json': {
            schema: getModelSchemaRef(User),
          },
        },
      },
    },
  })
  async getUser(
    @param.path.number('id') id: typeof Consultation.prototype.id,
  ): Promise<User> {
    return this.consultationRepository.user(id);
  }
}
