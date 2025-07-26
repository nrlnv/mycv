import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { promisify } from 'util';
import { randomBytes, scrypt as _scrypt } from 'crypto';

const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async signup(email: string, password: string) {
    // see if email is in use
    const users = await this.usersService.find(email);

    if (users.length) {
      throw new BadRequestException('email in use');
    }
    // hash users password
    // generate salt
    const salt = randomBytes(8).toString('hex');
    // hash salt and password together
    const hash = (await scrypt(password, salt, 32)) as Buffer;
    // join hashed result with salt
    const result = salt + '.' + hash.toString('hex');

    // create new user and save it

    const user = await this.usersService.create(email, result);

    // return user

    return user;
  }

  async signin(email: string, password: string) {
    // find user
    const [user] = await this.usersService.find(email);
    if (!user) {
      throw new NotFoundException('user not found');
    }

    // check password

    const [salt, storedHash] = user.password.split('.');
    const hash = (await scrypt(password, salt, 32)) as Buffer;
    if (storedHash !== hash.toString('hex')) {
      throw new BadRequestException('incorrect password');
    }

    return user;
  }
}
