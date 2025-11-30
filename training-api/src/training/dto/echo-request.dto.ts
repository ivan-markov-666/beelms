import { IsDefined } from 'class-validator';

export class EchoRequestDto {
  @IsDefined()
  value!: unknown;
}
