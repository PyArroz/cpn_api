import {belongsTo, Entity, hasMany, model, property} from '@loopback/repository';
import {OwnedPackage} from './owned-package.model';
import {Role} from './role.model';
import {UserAccess} from './user-access.model';

@model()
export class User extends Entity {
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
  email: string;

  @property({
    type: 'string',
    required: true,
  })
  password: string;

  @property({
    type: 'string',
  })
  token?: string;

  @property({
    type: 'string',
  })
  name?: string;

  @property({
    type: 'string',
  })
  lastname?: string;

  @property({
    type: 'boolean',
    default: true
  })
  active?: boolean;

  @property({
    type: 'boolean',
    default: false
  })
  isDeleted?: boolean;

  @property({
    type: 'string',
  })
  phone?: string;

  @property({
    type: 'date',
    default: () => new Date()
  })
  created?: string;

  @property({
    type: 'date',
  })
  lastSeen?: string;

  @belongsTo(() => Role)
  roleId: number;

  @hasMany(() => UserAccess)
  userAccesses: UserAccess[];

  @property({
    type: 'number',
    dataType: 'FLOAT'
  })
  citationFee?: number;

  @property({
    type: 'boolean',
    default: false
  })
  hasFixedPlan?: boolean;

  @hasMany(() => OwnedPackage)
  ownedPackages: OwnedPackage[];

  constructor(data?: Partial<User>) {
    super(data);
  }
}

export interface UserRelations {
  // describe navigational properties here
}

export type UserWithRelations = User & UserRelations;
