import {belongsTo, Entity, hasMany, hasOne, model, property} from '@loopback/repository';
import {Consultation} from './consultation.model';
import {File} from './file.model';
import {Headquarter} from './headquarter.model';

@model()
export class Office extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
  })
  number: string;

  @property({
    type: 'string',
    required: true,
  })
  hexColor: string;

  @belongsTo(() => Headquarter)
  headquarterId: number;

  @hasMany(() => Consultation)
  consultations: Consultation[];

  @hasOne(() => File)
  image: File;

  constructor(data?: Partial<Office>) {
    super(data);
  }
}

export interface OfficeRelations {
  // describe navigational properties here
}

export type OfficeWithRelations = Office & OfficeRelations;
