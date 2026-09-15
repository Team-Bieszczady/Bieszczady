import { IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';

export class ConfirmPasswordResetDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/, {
    message:
      'Hasło musi zawierać wielką literę, małą literę, cyfrę i znak specjalny (@$!%*?&)',
  })
  newPassword!: string;

  @IsString()
  @IsNotEmpty()
  confirmPassword!: string;
}
