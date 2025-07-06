import { IsEmail } from 'class-validator'

export class TestDto {
  @IsEmail()
  email!: string
}
