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
      'Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character (@$!%*?&)',
  })
  newPassword!: string;

  @IsString()
  @IsNotEmpty()
  confirmPassword!: string;
}
