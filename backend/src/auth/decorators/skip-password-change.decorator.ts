import { SetMetadata } from '@nestjs/common';

export const SKIP_PASSWORD_CHANGE_CHECK = 'skipPasswordChange';
export const SkipPasswordChange = () =>
  SetMetadata(SKIP_PASSWORD_CHANGE_CHECK, true);
