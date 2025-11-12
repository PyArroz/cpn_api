import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Office} from './office.model';
import {User} from './user.model';

@model()
export class Consultation extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'date',
  })
  startDate?: string;

  @property({
    type: 'date',
  })
  endDate?: string;

  @property({
    type: 'boolean',
    default: false
  })
  isDeleted?: boolean;

  @property({
    type: 'boolean',
    default: true
  })
  isFlex?: boolean;

  @belongsTo(() => Office)
  officeId: number;

  @belongsTo(() => User)
  userId: number;

  constructor(data?: Partial<Consultation>) {
    super(data);
  }
}

export interface ConsultationRelations {
  // describe navigational properties here
}

export type ConsultationWithRelations = Consultation & ConsultationRelations;
