import {Entity, model, property} from '@loopback/repository';
import {v4 as uuidv4} from 'uuid';

@model()
export class File extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: false,
    default: () => uuidv4()
  })
  id?: string;

  @property({
    type: 'string',
    required: true,
  })
  filename: string;

  @property({
    type: 'string',
  })
  oname: string;

  @property({
    type: 'string',
  })
  mimetype?: string;

  @property({
    type: 'number',
  })
  size?: number;

  @property({
    type: 'number',
  })
  officeId?: number;

  constructor(data?: Partial<File>) {
    super(data);
  }
}

export interface FileRelations {
  // describe navigational properties here
}

export type FileWithRelations = File & FileRelations;
