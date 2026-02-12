import {inject} from '@loopback/core';
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
  Request,
  requestBody,
  response,
  Response,
  RestBindings,
} from '@loopback/rest';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import multer from 'multer';
import * as path from 'path';
import {v4 as uuidv4} from 'uuid';
import {JwtTokenConfig} from '../config/JwtTokenConfig';
import {Headquarter} from '../models';
import {FileRepository, HeadquarterFeeRepository, HeadquarterRepository, OfficeRepository, UserAccessRepository, UserRepository} from '../repositories';

export class HeadquartersController {
  private storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      const uploadPath = path.join(__dirname, '../../uploads');
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, {recursive: true});
      }
      cb(null, uploadPath);
    },
    filename: (_req, file, cb) => {
      const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  });

  private upload = multer({storage: this.storage});

  constructor(
    @repository(HeadquarterRepository)
    public headquarterRepository: HeadquarterRepository,
    @repository(UserRepository)
    public userRepository: UserRepository,
    @repository(UserAccessRepository)
    public userAccessRepository: UserAccessRepository,
    @repository(OfficeRepository)
    public officeRepository: OfficeRepository,
    @repository(FileRepository)
    public fileRepository: FileRepository,
    @repository(HeadquarterFeeRepository)
    public headquarterFeeRepository: HeadquarterFeeRepository,
  ) { }

  @post('/headquarters')
  @response(200, {
    description: 'Headquarter model instance',
    content: {'application/json': {schema: getModelSchemaRef(Headquarter)}},
  })
  async create(
    @requestBody({
      description: 'multipart/form-data value.',
      required: true,
      content: {
        'multipart/form-data': {
          'x-parser': 'stream',
          schema: {
            type: 'object',
            properties: {
              name: {type: 'string'},
              address1: {type: 'string'},
              address2: {type: 'string'},
              zipCode: {type: 'string'},
              phone: {type: 'string'},
              fee: {type: 'number'},
              config: {type: 'string'},
              offices: {type: 'string'},
            },
          },
        },
      },
    })
    request: Request,
    @inject(RestBindings.Http.RESPONSE) res: Response,
  ): Promise<Headquarter> {
    return new Promise<Headquarter>((resolve, reject) => {
      this.upload.any()(request, res, async (err: unknown) => {
        if (err) reject(err);
        try {
          const {name, address1, address2, zipCode, phone, config, offices: officesJson, fee} = request.body;

          const headquarterData: any = {name};
          if (address1) headquarterData.address1 = address1;
          if (address2) headquarterData.address2 = address2;
          if (zipCode) headquarterData.zipCode = zipCode;
          if (phone) headquarterData.phone = phone;
          if (fee) headquarterData.fee = parseFloat(fee);
          if (config) headquarterData.config = JSON.parse(config);

          const createdHeadquarter = await this.headquarterRepository.create(headquarterData);

          // Crear registro de HeadquarterFee si se proporcionó fee
          if (fee !== undefined && createdHeadquarter.id) {
            await this.headquarterFeeRepository.create({
              fee: parseFloat(fee),
              created: new Date().toISOString(),
              headquarterId: createdHeadquarter.id,
            });
          }

          // Procesar offices si vienen en el request
          if (officesJson) {
            const offices = JSON.parse(officesJson);
            const files = request.files as Express.Multer.File[];

            for (let i = 0; i < offices.length; i++) {
              const officeData = offices[i];
              const createdOffice = await this.officeRepository.create({
                number: officeData.number,
                hexColor: officeData.hexColor,
                headquarterId: createdHeadquarter.id,
              });

              // Buscar si hay imagen para este office (image_0, image_1, etc.)
              const imageFile = files?.find(f => f.fieldname === `image_${i}`);
              if (imageFile) {
                await this.fileRepository.create({
                  filename: imageFile.filename,
                  oname: imageFile.originalname,
                  mimetype: imageFile.mimetype,
                  size: imageFile.size,
                  officeId: createdOffice.id,
                });
              }
            }
          }

          // Retornar el headquarter con sus offices e imágenes
          const result = await this.headquarterRepository.findById(createdHeadquarter.id!, {
            include: [
              {
                relation: 'offices',
                scope: {include: [{relation: 'image'}]},
              },
            ],
          });
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
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
                relation: 'image'
              },
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
        },
        {
          relation: 'headquarterFees'
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
                  relation: 'image'
                },
                {
                  relation: 'consultations',
                  scope: {
                    include: [
                      {
                        relation: 'user',
                        scope: {
                          include: [
                            {
                              relation: 'ownedPackages',
                              scope: {
                                include: ['package']
                              }
                            }
                          ]
                        }
                      }
                    ]
                  }
                }
              ]
            }
          },
          {
            relation: 'headquarterFees'
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
                relation: 'image'
              },
              {
                relation: 'consultations',
                scope: {
                  include: [
                    {
                      relation: 'user',
                      scope: {
                        include: [
                          {
                            relation: 'ownedPackages',
                            scope: {
                              include: ['package']
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              }
            ]
          }
        },
        {
          relation: 'headquarterFees'
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
      description: 'multipart/form-data value.',
      required: true,
      content: {
        'multipart/form-data': {
          'x-parser': 'stream',
          schema: {
            type: 'object',
            properties: {
              name: {type: 'string'},
              address1: {type: 'string'},
              address2: {type: 'string'},
              zipCode: {type: 'string'},
              phone: {type: 'string'},
              fee: {type: 'number'},
              config: {type: 'string'},
              offices: {type: 'string'},
            },
          },
        },
      },
    })
    request: Request,
    @inject(RestBindings.Http.RESPONSE) res: Response,
  ): Promise<Headquarter> {
    return new Promise<Headquarter>((resolve, reject) => {
      this.upload.any()(request, res, async (err: unknown) => {
        if (err) reject(err);
        try {
          const {name, address1, address2, zipCode, phone, config, offices: officesJson, fee} = request.body;

          // Actualizar headquarter
          const headquarterData: any = {};
          if (name) headquarterData.name = name;
          if (address1) headquarterData.address1 = address1;
          if (address2) headquarterData.address2 = address2;
          if (zipCode) headquarterData.zipCode = zipCode;
          if (phone) headquarterData.phone = phone;
          if (fee) headquarterData.fee = parseFloat(fee);
          if (config) headquarterData.config = JSON.parse(config);

          await this.headquarterRepository.updateById(id, headquarterData);

          // Crear registro de HeadquarterFee si se actualizó el fee
          if (fee !== undefined) {
            await this.headquarterFeeRepository.create({
              fee: parseFloat(fee),
              created: new Date().toISOString(),
              headquarterId: id,
            });
          }

          // Procesar offices si vienen en el request
          if (officesJson !== undefined) {
            const offices = JSON.parse(officesJson);
            const files = request.files as Express.Multer.File[];

            // Obtener las offices actuales del headquarter
            const currentOffices = await this.officeRepository.find({
              where: {headquarterId: id},
            });

            // Obtener los IDs de las offices que vienen en el request
            const requestOfficeIds = offices.filter((o: any) => o.id).map((o: any) => o.id);

            // Eliminar las offices que ya no están en el arreglo
            for (const currentOffice of currentOffices) {
              if (!requestOfficeIds.includes(currentOffice.id!)) {
                // Eliminar imagen asociada si existe
                try {
                  const existingImage = await this.officeRepository.image(currentOffice.id!).get();
                  if (existingImage) {
                    const oldFilePath = path.join(__dirname, '../../uploads', existingImage.filename);
                    if (fs.existsSync(oldFilePath)) {
                      fs.unlinkSync(oldFilePath);
                    }
                    await this.fileRepository.deleteById(existingImage.id);
                  }
                } catch (error) {
                  // No existe imagen previa
                }
                await this.officeRepository.deleteById(currentOffice.id!);
              }
            }

            // Actualizar o crear las offices del request
            for (let i = 0; i < offices.length; i++) {
              const officeData = offices[i];
              const imageFile = files?.find(f => f.fieldname === `image_${i}`);

              if (officeData.id) {
                // Actualizar office existente
                await this.officeRepository.updateById(officeData.id, {
                  number: officeData.number,
                  hexColor: officeData.hexColor,
                  headquarterId: id,
                });

                // Si hay nueva imagen, reemplazar la anterior
                if (imageFile) {
                  try {
                    const existingImage = await this.officeRepository.image(officeData.id).get();
                    if (existingImage) {
                      const oldFilePath = path.join(__dirname, '../../uploads', existingImage.filename);
                      if (fs.existsSync(oldFilePath)) {
                        fs.unlinkSync(oldFilePath);
                      }
                      await this.fileRepository.deleteById(existingImage.id);
                    }
                  } catch (error) {
                    // No existe imagen previa
                  }

                  await this.fileRepository.create({
                    filename: imageFile.filename,
                    oname: imageFile.originalname,
                    mimetype: imageFile.mimetype,
                    size: imageFile.size,
                    officeId: officeData.id,
                  });
                }
              } else {
                // Crear nueva office
                const createdOffice = await this.officeRepository.create({
                  number: officeData.number,
                  hexColor: officeData.hexColor,
                  headquarterId: id,
                });

                // Si hay imagen, asociarla
                if (imageFile) {
                  await this.fileRepository.create({
                    filename: imageFile.filename,
                    oname: imageFile.originalname,
                    mimetype: imageFile.mimetype,
                    size: imageFile.size,
                    officeId: createdOffice.id,
                  });
                }
              }
            }
          }

          // Retornar el headquarter actualizado con sus offices e imágenes
          const result = await this.headquarterRepository.findById(id, {
            include: [
              {
                relation: 'offices',
                scope: {include: [{relation: 'image'}]},
              },
            ],
          });
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
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
