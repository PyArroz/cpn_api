import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  HttpErrors,
  param,
  patch,
  post,
  put,
  requestBody,
  response,
} from '@loopback/rest';
import * as jwt from 'jsonwebtoken';
import {JwtTokenConfig} from '../config/JwtTokenConfig';
import {Headquarter} from '../models';
import {HeadquarterRepository, UserAccessRepository, UserRepository} from '../repositories';

export class HeadquartersController {
  constructor(
    @repository(HeadquarterRepository)
    public headquarterRepository: HeadquarterRepository,
    @repository(UserRepository)
    public userRepository: UserRepository,
    @repository(UserAccessRepository)
    public userAccessRepository: UserAccessRepository,
  ) { }

  @post('/headquarters')
  @response(200, {
    description: 'Headquarter model instance',
    content: {'application/json': {schema: getModelSchemaRef(Headquarter)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Headquarter, {
            title: 'NewHeadquarter',
            exclude: ['id'],
          }),
        },
      },
    })
    headquarter: Omit<Headquarter, 'id'>,
  ): Promise<Headquarter> {
    return this.headquarterRepository.create(headquarter);
  }

  @get('/headquarters/count')
  @response(200, {
    description: 'Headquarter model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Headquarter) where?: Where<Headquarter>,
  ): Promise<Count> {
    return this.headquarterRepository.count(where);
  }

  @get('/headquarters')
  @response(200, {
    description: 'Array of Headquarter model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Headquarter, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Headquarter) filter?: Filter<Headquarter>,
  ): Promise<Headquarter[]> {
    return this.headquarterRepository.find({
      ...filter,
      where: {...filter?.where, isDeleted: false},
      include: [
        {
          relation: 'offices',
          scope: {
            include: [
              {
                relation: 'consultations',
                scope: {
                  include: [
                    {
                      relation: 'user'
                    }
                  ]
                }
              }
            ]
          }
        }
      ]
    });
  }

  @get('/headquarters/user')
  @response(200, {
    description: 'Array of Headquarter model instances for a specific user',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Headquarter, {includeRelations: true}),
        },
      },
    },
  })
  async findByUser(
    @param.query.string('access_token') accessToken: string
  ): Promise<Headquarter[]> {
    if (!accessToken) throw new HttpErrors.BadRequest('Access token is required');

    // Verificar el token JWT
    const jwtVerifyOptions: jwt.VerifyOptions = {
      issuer: JwtTokenConfig.issuer,
      audience: JwtTokenConfig.audience,
    };

    const decodedToken = jwt.verify(accessToken, JwtTokenConfig.secretKey, jwtVerifyOptions);
    const userId = (decodedToken as any).id;

    if (!userId) {
      throw new HttpErrors.Unauthorized('Invalid token');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new HttpErrors.NotFound('User not found');
    }

    // Obtener los userAccesses del usuario
    const userAccesses = await this.userAccessRepository.find({
      where: {userId: userId}
    });

    // Si no tiene ningún acceso, devolver todos los headquarters
    if (userAccesses.length === 0) {
      return this.headquarterRepository.find({
        where: {isDeleted: false},
        include: [
          {
            relation: 'offices',
            scope: {
              include: [
                {
                  relation: 'consultations',
                  scope: {
                    include: [
                      {
                        relation: 'user'
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      });
    }

    // Extraer los headquarterIds
    const headquarterIds = userAccesses.map(ua => ua.headquarterId);

    // Obtener los headquarters correspondientes
    return this.headquarterRepository.find({
      where: {
        id: {inq: headquarterIds},
        isDeleted: false
      },
      include: [
        {
          relation: 'offices',
          scope: {
            include: [
              {
                relation: 'consultations',
                scope: {
                  include: [
                    {
                      relation: 'user'
                    }
                  ]
                }
              }
            ]
          }
        }
      ]
    });
  }

  @patch('/headquarters')
  @response(200, {
    description: 'Headquarter PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Headquarter, {partial: true}),
        },
      },
    })
    headquarter: Headquarter,
    @param.where(Headquarter) where?: Where<Headquarter>,
  ): Promise<Count> {
    return this.headquarterRepository.updateAll(headquarter, where);
  }

  @get('/headquarters/{id}')
  @response(200, {
    description: 'Headquarter model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Headquarter, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Headquarter, {exclude: 'where'}) filter?: FilterExcludingWhere<Headquarter>
  ): Promise<Headquarter> {
    return this.headquarterRepository.findById(id, filter);
  }

  @patch('/headquarters/{id}')
  @response(204, {
    description: 'Headquarter PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Headquarter, {partial: true}),
        },
      },
    })
    headquarter: Headquarter,
  ): Promise<void> {
    await this.headquarterRepository.updateById(id, headquarter);
  }

  @put('/headquarters/{id}')
  @response(204, {
    description: 'Headquarter PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() headquarter: Headquarter,
  ): Promise<void> {
    await this.headquarterRepository.replaceById(id, headquarter);
  }

  @del('/headquarters/{id}')
  @response(204, {
    description: 'Headquarter soft DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.headquarterRepository.updateById(id, {isDeleted: true});
  }
}
