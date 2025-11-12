import {Entity, model, property, belongsTo, hasMany} from '@loopback/repository';
import {Headquarter} from './headquarter.model';
import {Consultation} from './consultation.model';

@model()
export class Office extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'number',
  })
  number: number;

  @property({
    type: 'string',
  })
  name?: string;

  @belongsTo(() => Headquarter)
  headquarterId: number;

  @hasMany(() => Consultation)
  consultations: Consultation[];

  constructor(data?: Partial<Office>) {
    super(data);
  }
}

export interface OfficeRelations {
  // describe navigational properties here
}

export type OfficeWithRelations = Office & OfficeRelations;
