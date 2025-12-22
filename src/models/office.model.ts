import {belongsTo, Entity, hasMany, model, property} from '@loopback/repository';
import {Consultation} from './consultation.model';
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
