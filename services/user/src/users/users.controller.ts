import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ResourceOwnerGuard } from '../auth/guards/resource-owner.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { CreateProfileDto } from './dto/create-profile.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  UpdateUserSettingsDto,
  UserSettingsDto,
} from './dto/user-settings.dto';
import { UserProfile } from './entities/user-profile.entity';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: User,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: 200,
    description: 'List of all users',
    type: [User],
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({ status: 200, description: 'User found', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not resource owner' })
  @UseGuards(JwtAuthGuard, ResourceOwnerGuard)
  findOne(@Param('id') id: string): Promise<User> {
    const userId = Number(id);
    if (isNaN(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    return this.usersService.findOne(userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: User,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    const userId = Number(id);
    if (isNaN(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    return this.usersService.update(userId, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string): Promise<void> {
    const userId = Number(id);
    if (isNaN(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    return this.usersService.remove(userId);
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a user' })
  @ApiResponse({
    status: 200,
    description: 'User deactivated successfully',
    type: User,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  deactivate(@Param('id') id: string): Promise<User> {
    const userId = Number(id);
    if (isNaN(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    return this.usersService.deactivate(userId);
  }

  // Profile endpoints
  @Post(':id/profile')
  @ApiOperation({ summary: 'Create a profile for a user' })
  @ApiResponse({
    status: 201,
    description: 'Profile created successfully',
    type: UserProfile,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not resource owner' })
  @UseGuards(JwtAuthGuard, ResourceOwnerGuard)
  createProfile(
    @Param('id') id: string,
    @Body() createProfileDto: CreateProfileDto,
  ): Promise<UserProfile> {
    const userId = Number(id);
    if (isNaN(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    return this.usersService.createProfile(userId, createProfileDto);
  }

  @Get(':id/profile')
  @ApiOperation({ summary: 'Get the profile of a user' })
  @ApiResponse({ status: 200, description: 'Profile found', type: UserProfile })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not resource owner' })
  @UseGuards(JwtAuthGuard, ResourceOwnerGuard)
  getProfile(@Param('id') id: string): Promise<UserProfile> {
    const userId = Number(id);
    if (isNaN(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    return this.usersService.getProfile(userId);
  }

  @Patch(':id/profile')
  @ApiOperation({ summary: 'Update the profile of a user' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: UserProfile,
  })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not resource owner' })
  @UseGuards(JwtAuthGuard, ResourceOwnerGuard)
  updateProfile(
    @Param('id') id: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<UserProfile> {
    const userId = Number(id);
    if (isNaN(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    return this.usersService.updateProfile(userId, updateProfileDto);
  }

  // User Settings endpoints
  @Get(':id/settings')
  @ApiOperation({ summary: 'Get the settings of a user' })
  @ApiResponse({
    status: 200,
    description: 'Settings retrieved successfully',
    type: UserSettingsDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not resource owner' })
  @UseGuards(JwtAuthGuard, ResourceOwnerGuard)
  getUserSettings(@Param('id') id: string): Promise<UserSettingsDto> {
    const userId = Number(id);
    if (isNaN(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    return this.usersService.getUserSettings(userId);
  }

  @Patch(':id/settings')
  @ApiOperation({ summary: 'Update the settings of a user' })
  @ApiResponse({
    status: 200,
    description: 'Settings updated successfully',
    type: UserSettingsDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not resource owner' })
  @UseGuards(JwtAuthGuard, ResourceOwnerGuard)
  updateUserSettings(
    @Param('id') id: string,
    @Body() updateUserSettingsDto: UpdateUserSettingsDto,
  ): Promise<UserSettingsDto> {
    const userId = Number(id);
    if (isNaN(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    return this.usersService.updateUserSettings(userId, updateUserSettingsDto);
  }

  @Post(':id/settings/reset')
  @ApiOperation({ summary: 'Reset the settings of a user to default values' })
  @ApiResponse({
    status: 200,
    description: 'Settings reset successfully',
    type: UserSettingsDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not resource owner' })
  @UseGuards(JwtAuthGuard, ResourceOwnerGuard)
  resetUserSettings(@Param('id') id: string): Promise<UserSettingsDto> {
    const userId = Number(id);
    if (isNaN(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    return this.usersService.resetUserSettings(userId);
  }
}
