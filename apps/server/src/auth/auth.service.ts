import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { LoginDto } from './dto/login.dto'

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async login(dto: LoginDto) {
    const username = process.env.ADMIN_USERNAME || 'admin'
    const password = process.env.ADMIN_PASSWORD || 'admin123'

    if (dto.username !== username || dto.password !== password) {
      throw new UnauthorizedException('用户名或密码错误')
    }

    const payload = { sub: 'admin', username }
    return {
      access_token: this.jwtService.sign(payload),
      username,
    }
  }
}
