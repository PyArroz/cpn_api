import {
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {
  Office,
  Headquarter,
} from '../models';
import {OfficeRepository} from '../repositories';

export class OfficeHeadquarterController {
  constructor(
    @repository(OfficeRepository)
    public officeRepository: OfficeRepository,
  ) { }

  @get('/offices/{id}/headquarter', {
    responses: {
      '200': {
        description: 'Headquarter belonging to Office',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Headquarter),
          },
        },
      },
    },
  })
  async getHeadquarter(
    @param.path.number('id') id: typeof Office.prototype.id,
  ): Promise<Headquarter> {
    return this.officeRepository.headquarter(id);
  }
}
