import {Entity, model, property, belongsTo} from '@loopback/repository';
import {User} from './user.model';
import {Headquarter} from './headquarter.model';

@model()
export class UserAccess extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @belongsTo(() => User)
  userId: number;

  @belongsTo(() => Headquarter)
  headquarterId: number;

  constructor(data?: Partial<UserAccess>) {
    super(data);
  }
}

export interface UserAccessRelations {
  // describe navigational properties here
}

export type UserAccessWithRelations = UserAccess & UserAccessRelations;
