import {
  repository
} from '@loopback/repository';
import {
  del,
  get,
  HttpErrors,
  param,
  patch,
  post,
  requestBody,
  response
} from '@loopback/rest';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import {JwtTokenConfig} from '../config/JwtTokenConfig';
import {RoleRepository, UserRepository} from '../repositories';

export class UserController {
  constructor(
    @repository(UserRepository)
    public userRepository: UserRepository,
    @repository(RoleRepository)
    public roleRepository: RoleRepository,
  ) { }



  @del('/users/{id}')
  @response(204, {
    description: 'User soft DELETE success',
  })
  async deleteById(
    @param.path.number('id') id: number,
    @param.query.string('access_token') accessToken: string
  ): Promise<void> {
    if (!accessToken) throw new HttpErrors.BadRequest('Access token is required');
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new HttpErrors.NotFound('User not found');
    }
    return await this.userRepository.updateById(id, {isDeleted: true});
  }


  // --- GET ALL USERS ---
  @get('/users')
  @response(200, {
    description: 'Array of User model instances',
  })
  async find(): Promise<any[]> {
    const users = await this.userRepository.find({
      where: {isDeleted: false},
      include: [
        'role',
      ],
    });

    const sanitizedUsers = users.map(user => {
      const {password, ...rest} = user;
      return rest;
    });

    return sanitizedUsers;
  }


  // --- REGISTER USER ---
  @post('/register')
  async register(
    @param.query.string('access_token') accessToken: string,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['email', 'password', 'roleName'],
            properties: {
              email: {type: 'string', format: 'email'},
              password: {type: 'string', minLength: 6},
              name: {type: 'string'},
              lastname: {type: 'string'},
              roleName: {type: 'string'},
              phone: {type: 'string'},
            },
          },
        },
      },
    })
    newUser: any,
  ): Promise<any> {
    console.log("REGISTER_USER_EVENT");

    // if (!accessToken) throw new HttpErrors.BadRequest('Access token is required');

    const existingUser = await this.userRepository.findOne({
      where: {email: newUser.email},
    });
    if (existingUser) {
      throw new HttpErrors.Conflict('ERROR_USER_EXISTS');
    }

    // Buscar rol por nombre
    const role = await this.roleRepository.findOne({
      where: {name: newUser.roleName},
    });

    if (!role) {
      throw new HttpErrors.BadRequest(`Role ${newUser.roleName} not found`);
    }

    // Hashear password
    const hashedPassword = await bcrypt.hash(newUser.password, 10);

    // Crear usuario con roleId obtenido
    const createdUser = await this.userRepository.create({
      email: newUser.email,
      password: hashedPassword,
      roleId: role.id,
      created: new Date().toISOString(),
      name: newUser.name,
      lastname: newUser.lastname,
      phone: newUser.phone
    });

    return createdUser;
  }




  // --- LOGIN ---
  @post('/login')
  async login(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['email', 'password'],
            properties: {
              email: {type: 'string'},
              password: {type: 'string'},
            },
          },
        },
      },
    })
    credentials: any,
  ): Promise<any> {

    // SEARCH USER BY EMAIL
    const user = await this.userRepository.findOne({
      where: {email: credentials.email},
    });

    if (!user) {
      throw new HttpErrors.Unauthorized('Invalid credentials');
    }

    // COMPARE PASSWORDS
    const passwordMatches = await bcrypt.compare(credentials.password, user.password);
    if (!passwordMatches) {
      throw new HttpErrors.Unauthorized('Invalid credentials');
    }

    // GENERATE JWT TOKEN
    const token = jwt.sign(
      {id: user.id, email: user.email, roleId: user.roleId},
      JwtTokenConfig.secretKey,
      {
        issuer: JwtTokenConfig.issuer,
        audience: JwtTokenConfig.audience,
        // expiresIn: JwtTokenConfig.expiresIn || null,
      },
    );

    // UPDATE USER WITH TOKEN
    await this.userRepository.updateById(user.id, {token});

    // SEARCH USER WITH ROLE
    const userWithRole = await this.userRepository.findById(user.id, {
      include: ['role'],
    });

    // EXCLUDE PASSWORD FROM RESPONSE
    const {password, ...result} = userWithRole;
    return {user: result};
  }

  @patch('/users')
  @response(200, {
    description: 'Edit user',
  })
  async editUser(
    @requestBody() user: any,
  ): Promise<any> {

    const existingUser = await this.userRepository.findById(user.id);


    if (!existingUser) throw new HttpErrors.NotFound('User not found');

    await this.userRepository.updateById(user.id, {
      email: user.email,
      name: user.name,
      lastname: user.lastname,
    });


    const updatedUser = await this.userRepository.findById(user.id);

    const {password, ...result} = updatedUser;
    return result;
  }





}
