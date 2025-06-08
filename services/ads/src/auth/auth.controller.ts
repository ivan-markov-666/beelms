import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Tokens } from './interfaces/tokens.interface';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Обновяване на JWT токен чрез refresh токен' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Успешно обновени токени',
    type: Object,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Невалиден или изтекъл refresh токен',
  })
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refreshTokens(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<Tokens> {
    try {
      return await this.authService.refreshTokens(refreshTokenDto.refreshToken);
    } catch {
      throw new UnauthorizedException('Невалиден или изтекъл refresh токен');
    }
  }
}
