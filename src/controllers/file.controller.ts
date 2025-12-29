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
import multer from 'multer';
import * as path from 'path';
import {v4 as uuidv4} from 'uuid';
import {File} from '../models';
import {FileRepository} from '../repositories';

export class FileController {
  private readonly storageDirectory = path.join(__dirname, '../../uploads');

  constructor(
    @repository(FileRepository)
    public fileRepository: FileRepository,
  ) {
    // Asegurar que el directorio de almacenamiento existe
    if (!fs.existsSync(this.storageDirectory)) {
      fs.mkdirSync(this.storageDirectory, {recursive: true});
    }
  }

  @post('/files/upload')
  @response(200, {
    description: 'File upload',
    content: {'application/json': {schema: getModelSchemaRef(File)}},
  })
  async upload(
    @requestBody({
      description: 'multipart/form-data value.',
      required: true,
      content: {
        'multipart/form-data': {
          'x-parser': 'stream',
          schema: {
            type: 'object',
            required: ['file', 'procedureId'],
            properties: {
              file: {
                type: 'string',
                format: 'binary',
              },
              procedureId: {
                type: 'string',
              },
              isResolution: {
                type: 'boolean',
              },
            },
          },
        },
      },
    })
    request: Request,
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ): Promise<File> {
    return new Promise<File>((resolve, reject) => {
      const storage = multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, this.storageDirectory);
        },
        filename: (req, file, cb) => {
          const uniqueId = uuidv4();
          const ext = path.extname(file.originalname);
          const filename = `${path.basename(file.originalname, ext)}-${uniqueId}${ext}`;
          cb(null, filename);
        },
      });

      const upload = multer({storage}).single('file');

      upload(request, response, async (err: any) => {
        if (err) {
          reject(err);
          return;
        }

        const uploadedFile = (request as any).file;
        if (!uploadedFile) {
          reject(new Error('No file uploaded'));
          return;
        }

        const fileData: Partial<File> = {
          filename: uploadedFile.filename,
          oname: uploadedFile.originalname,
          mimetype: uploadedFile.mimetype,
          size: uploadedFile.size,
        };

        try {
          const savedFile = await this.fileRepository.create(fileData);
          resolve(savedFile);
        } catch (error) {
          // Si falla la creación en BD, eliminar el archivo físico
          fs.unlinkSync(uploadedFile.path);
          reject(error);
        }
      });
    });
  }

  @get('/files/{id}/preview')
  @response(200, {
    description: 'Preview image file',
    content: {
      'image/png': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
      'image/jpeg': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
      'image/gif': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
      'image/webp': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async previewImage(
    @param.path.string('id') id: string,
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ): Promise<Response> {
    const file = await this.fileRepository.findById(id);
    const filePath = path.join(this.storageDirectory, file.filename);

    if (!fs.existsSync(filePath)) {
      throw new Error('File not found on disk');
    }

    const fileBuffer = fs.readFileSync(filePath);

    // Establecer content-type para mostrar la imagen en el navegador
    response.setHeader('Content-Type', file.mimetype || 'image/jpeg');
    response.setHeader('Content-Length', fileBuffer.length.toString());
    response.setHeader('Cache-Control', 'public, max-age=31536000');

    response.send(fileBuffer);
    return response;
  }

  @get('/files/{id}/download')
  @response(200, {
    description: 'Download file',
    content: {
      'application/octet-stream': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async download(
    @param.path.string('id') id: string,
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ): Promise<Response> {  // ← Cambiar a Promise<Response>
    console.log(`[File Download] Requested file ID: ${id}`);

    const file = await this.fileRepository.findById(id);
    console.log(`[File Download] File found in DB:`, {
      id: file.id,
      filename: file.filename,
      oname: file.oname,
      mimetype: file.mimetype,
      size: file.size,
    });

    const filePath = path.join(this.storageDirectory, file.filename);
    console.log(`[File Download] Full file path: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      console.error(`[File Download] ERROR: File not found on disk at path: ${filePath}`);
      throw new Error('File not found on disk');
    }

    const fileStats = fs.statSync(filePath);
    console.log(`[File Download] File exists on disk, size: ${fileStats.size} bytes`);

    // Leer el archivo completo
    const fileBuffer = fs.readFileSync(filePath);

    // Headers necesarios para la descarga
    response.setHeader('Content-Type', file.mimetype || 'application/octet-stream');
    response.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.oname || file.filename)}"`);
    response.setHeader('Content-Length', fileBuffer.length.toString());

    console.log(`[File Download] Sending file: ${file.oname || file.filename}`);

    // Enviar el buffer directamente
    response.send(fileBuffer);

    return response;  // ← Retornar el response
  }

  @get('/files/count')
  @response(200, {
    description: 'File model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(File) where?: Where<File>,
  ): Promise<Count> {
    return this.fileRepository.count(where);
  }

  @get('/files')
  @response(200, {
    description: 'Array of File model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(File, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(File) filter?: Filter<File>,
  ): Promise<File[]> {
    return this.fileRepository.find(filter);
  }

  @patch('/files')
  @response(200, {
    description: 'File PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(File, {partial: true}),
        },
      },
    })
    file: File,
    @param.where(File) where?: Where<File>,
  ): Promise<Count> {
    return this.fileRepository.updateAll(file, where);
  }

  @get('/files/{id}')
  @response(200, {
    description: 'File model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(File, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(File, {exclude: 'where'}) filter?: FilterExcludingWhere<File>
  ): Promise<File> {
    return this.fileRepository.findById(id, filter);
  }

  @patch('/files/{id}')
  @response(204, {
    description: 'File PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(File, {partial: true}),
        },
      },
    })
    file: File,
  ): Promise<void> {
    await this.fileRepository.updateById(id, file);
  }

  @put('/files/{id}')
  @response(204, {
    description: 'File PUT success',
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() file: File,
  ): Promise<void> {
    await this.fileRepository.replaceById(id, file);
  }

  @del('/files/{id}')
  @response(204, {
    description: 'File DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    const file = await this.fileRepository.findById(id);
    const filePath = path.join(this.storageDirectory, file.filename);

    // Eliminar archivo físico si existe
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await this.fileRepository.deleteById(id);
  }
}
