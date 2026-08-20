import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
@Injectable()
export class AuthService {
  // tymczasowe dane do czasu wdrożenia modelu User
  private readonly users = [
    {
      id: '1',
      firstName: 'Jan',
      lastName: 'Kowalski',
      email: 'test@example.com',
      passwordHash:
        '$2b$10$4EhmxWW38ZDsw4eFtRKIZeQ1JKnzjdO4A8.qtUHhxqerUo6/fklmm',
      role: 'DIRECTOR',
      accountStatus: 'ACTIVE',
      mustChangePassword: false,
    },
  ];
  constructor(private readonly jwtService: JwtService) {}
  findByEmail = (email: string) => {
    return this.users.find((el) => el.email === email);
  };
  findById = (id: string) => {
    return this.users.find((el) => el.id === id);
  };

  async validateUser(email: string, password: string) {
    const user = this.findByEmail(email);
    if (!user) {
      return null;
    } else if (user.accountStatus !== 'ACTIVE') {
      return null;
    }
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    } else {
      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        accountStatus: user.accountStatus,
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
