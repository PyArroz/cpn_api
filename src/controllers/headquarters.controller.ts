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
import {Headquarter, Office} from '../models';
import {HeadquarterRepository, OfficeRepository, UserAccessRepository, UserRepository} from '../repositories';

export class HeadquartersController {
  constructor(
    @repository(HeadquarterRepository)
    public headquarterRepository: HeadquarterRepository,
    @repository(UserRepository)
    public userRepository: UserRepository,
    @repository(UserAccessRepository)
    public userAccessRepository: UserAccessRepository,
    @repository(OfficeRepository)
    public officeRepository: OfficeRepository,
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
          schema: {
            type: 'object',
            required: ['name'],
            properties: {
              name: {type: 'string'},
              address1: {type: 'string'},
              address2: {type: 'string'},
              zipCode: {type: 'string'},
              phone: {type: 'string'},
              isDeleted: {type: 'boolean'},
              updatedAt: {type: 'string', format: 'date-time'},
              config: {},
              offices: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['number', 'hexColor'],
                  properties: {
                    number: {type: 'string'},
                    hexColor: {type: 'string'},
                  },
                },
              },
            },
          },
        },
      },
    })
    data: Omit<Headquarter, 'id'> & {offices?: Omit<Office, 'id' | 'headquarterId'>[]},
  ): Promise<Headquarter> {
    const {offices, ...headquarterData} = data;
    const createdHeadquarter = await this.headquarterRepository.create(headquarterData);

    // Crear las offices si vienen en el request
    if (offices && offices.length > 0) {
      for (const office of offices) {
        await this.officeRepository.create({
          ...office,
          headquarterId: createdHeadquarter.id,
        });
      }
    }

    // Retornar el headquarter con sus offices
    return this.headquarterRepository.findById(createdHeadquarter.id!, {
      include: [{relation: 'offices'}],
    });
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
  @response(200, {
    description: 'Headquarter PATCH success',
    content: {'application/json': {schema: getModelSchemaRef(Headquarter)}},
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              name: {type: 'string'},
              address1: {type: 'string'},
              address2: {type: 'string'},
              zipCode: {type: 'string'},
              phone: {type: 'string'},
              isDeleted: {type: 'boolean'},
              updatedAt: {type: 'string', format: 'date-time'},
              config: {},
              offices: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: {type: 'number'},
                    number: {type: 'string'},
                    hexColor: {type: 'string'},
                  },
                },
              },
            },
          },
        },
      },
    })
    data: Partial<Headquarter> & {offices?: (Partial<Office> & {id?: number})[]},
  ): Promise<Headquarter> {
    const {offices, ...headquarterData} = data;

    // Actualizar headquarter
    await this.headquarterRepository.updateById(id, headquarterData);

    // Procesar offices si vienen en el request
    if (offices !== undefined) {
      // Obtener las offices actuales del headquarter
      const currentOffices = await this.officeRepository.find({
        where: {headquarterId: id}
      });

      // Obtener los IDs de las offices que vienen en el request
      const requestOfficeIds = offices
        .filter(o => o.id)
        .map(o => o.id!);

      // Eliminar las offices que ya no están en el arreglo
      for (const currentOffice of currentOffices) {
        if (!requestOfficeIds.includes(currentOffice.id!)) {
          await this.officeRepository.deleteById(currentOffice.id!);
        }
      }

      // Actualizar o crear las offices del request
      for (const office of offices) {
        if (office.id) {
          // Si tiene id, actualizar la office existente
          await this.officeRepository.updateById(office.id, {
            ...office,
            headquarterId: id,
          });
        } else {
          // Si no tiene id, crear una nueva office
          await this.officeRepository.create({
            ...office,
            headquarterId: id,
          });
        }
      }
    }

    // Retornar el headquarter actualizado con sus offices
    return this.headquarterRepository.findById(id, {
      include: [{relation: 'offices'}],
    });
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
