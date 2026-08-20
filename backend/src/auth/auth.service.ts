import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
@Injectable()
export class AuthService {
  private readonly users = [
    {
      id: '1',
      email: 'test@example.com',
      passwordHash:
        '$2b$10$4EhmxWW38ZDsw4eFtRKIZeQ1JKnzjdO4A8.qtUHhxqerUo6/fklmm',
      role: 'DIRECTOR',
      status: 'ACTIVE',
      mustChangePassword: false,
    },
  ];
  constructor(private readonly jwtService: JwtService) {}
  findByEmail = (email: string) => {
    return this.users.find((el) => el.email === email);
  };

  async validateUser(email: string, password: string) {
    const user = this.findByEmail(email);
    if (!user) {
      return null;
    } else if (user.status !== 'ACTIVE') {
      return null;
    }
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    } else {
      return {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        mustChangePassword: user.mustChangePassword,
      };
    }
  }
  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException();
    }

    const payload = { sub: user.id, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);
    return { accessToken, user };
  }
}
