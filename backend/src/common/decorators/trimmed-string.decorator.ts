import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsString } from 'class-validator';

export function TrimmedString() {
  return applyDecorators(
    Transform(({ value }: { value: unknown }) =>
      typeof value === 'string' ? value.trim() : value,
    ),
    IsString(),
  );
}
