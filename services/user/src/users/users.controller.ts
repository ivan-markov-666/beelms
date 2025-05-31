import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateProfileDto } from './dto/create-profile.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
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
  // TODO: Implement AdminGuard
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({ status: 200, description: 'User found', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string): Promise<User> {
    const userId = Number(id);
    if (isNaN(userId)) {
      throw new Error('Invalid user ID');
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
  // TODO: Implement AdminGuard
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    const userId = Number(id);
    if (isNaN(userId)) {
      throw new Error('Invalid user ID');
    }
    return this.usersService.update(userId, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  // TODO: Implement AdminGuard
  remove(@Param('id') id: string): Promise<void> {
    const userId = Number(id);
    if (isNaN(userId)) {
      throw new Error('Invalid user ID');
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
  // TODO: Implement AdminGuard
  deactivate(@Param('id') id: string): Promise<User> {
    const userId = Number(id);
    if (isNaN(userId)) {
      throw new Error('Invalid user ID');
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
  createProfile(
    @Param('id') id: string,
    @Body() createProfileDto: CreateProfileDto,
  ): Promise<UserProfile> {
    const userId = Number(id);
    if (isNaN(userId)) {
      throw new Error('Invalid user ID');
    }
    return this.usersService.createProfile(userId, createProfileDto);
  }

  @Get(':id/profile')
  @ApiOperation({ summary: 'Get the profile of a user' })
  @ApiResponse({ status: 200, description: 'Profile found', type: UserProfile })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  getProfile(@Param('id') id: string): Promise<UserProfile> {
    const userId = Number(id);
    if (isNaN(userId)) {
      throw new Error('Invalid user ID');
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
  updateProfile(
    @Param('id') id: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<UserProfile> {
    const userId = Number(id);
    if (isNaN(userId)) {
      throw new Error('Invalid user ID');
    }
    return this.usersService.updateProfile(userId, updateProfileDto);
  }
}
