import {repository} from '@loopback/repository';
import * as bcrypt from 'bcryptjs';
import {RoleRepository, UserRepository} from '../repositories';

export class DbInitializer {
  constructor(
    @repository(RoleRepository) private roleRepository: RoleRepository,
    @repository(UserRepository) private userRepository: UserRepository,
  ) { }

  async initialize() {
    await this.createRoles([
      {name: 'superuser', nickname: 'superuser'},
      {name: 'admin', nickname: 'admin'},
      {name: 'user', nickname: 'terapeuta'},
    ]);

    await this.createSuperUser();
  }



  private async createRoles(roles: any[]) {
    for (const role of roles) {
      const found = await this.roleRepository.findOne({where: {name: role.name}});
      if (!found) {
        await this.roleRepository.create(role);
        console.log(`Role created: ${role.name}`);
      } else {
        console.log(`Role already exists: ${role.name}`);
      }
    }
  }

  private async createSuperUser() {
    const superuserEmail = 'superuser@neversin.com';

    // Verificar si el superusuario ya existe
    const existingSuperuser = await this.userRepository.findOne({
      where: {email: superuserEmail}
    });

    if (existingSuperuser) {
      console.log('Superuser already exists');
      return;
    }

    // Obtener el rol de superusuario
    const superuserRole = await this.roleRepository.findOne({
      where: {name: 'superuser'}
    });

    if (!superuserRole) {
      console.error('Superuser role not found. Cannot create superuser.');
      return;
    }

    // Hashear contraseña por defecto
    const defaultPassword = 'superuser123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Crear superusuario
    await this.userRepository.create({
      email: superuserEmail,
      password: hashedPassword,
      roleId: superuserRole.id,
      name: 'Super',
      lastname: 'User',
      created: new Date().toISOString(),
      active: true,
      isDeleted: false,
    });

    console.log('Superuser created successfully');
    console.log(`Email: ${superuserEmail}`);
    console.log(`Password: ${defaultPassword}`);
  }








}
