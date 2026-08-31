import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { NAME_MAX_LENGTH } from '../../common/validation/name';

describe('CreateUserDto name validation', () => {
  const validPayload = {
    firstName: 'Jan',
    lastName: 'Kowalski',
    email: 'jan@example.com',
    password: 'SecurePass123!',
  };

  const failedFields = (payload: Record<string, string | number>): string[] =>
    validateSync(plainToInstance(CreateUserDto, payload)).map(
      (error) => error.property,
    );

  it('accepts an ordinary name', () => {
    expect(failedFields(validPayload)).toEqual([]);
  });

  it.each([
    ['Polish diacritics', 'Żółkiewski'],
    ['a double-barrelled surname', 'Nowak-Kowalska'],
    ['a compound first name', 'Anna Maria'],
    ['a name at the length limit', 'a'.repeat(NAME_MAX_LENGTH)],
  ])('accepts %s', (_label, firstName) => {
    expect(failedFields({ ...validPayload, firstName })).toEqual([]);
  });

  it.each([
    ['digits only', '123'],
    ['letters mixed with digits', 'Jan123'],
    ['a trailing symbol', 'Jan!'],
    ['symbols only', '!!!'],
    ['a leading hyphen', '-Jan'],
    ['a trailing hyphen', 'Jan-'],
    ['a double space', 'Anna  Maria'],
    ['surrounding whitespace', '  Jan  '],
    ['an empty string', ''],
    ['one character over the limit', 'a'.repeat(NAME_MAX_LENGTH + 1)],
  ])('rejects %s', (_label, firstName) => {
    expect(failedFields({ ...validPayload, firstName })).toContain('firstName');
  });

  it('rejects a JSON number without throwing', () => {
    expect(() =>
      failedFields({ ...validPayload, firstName: 123 }),
    ).not.toThrow();
    expect(failedFields({ ...validPayload, firstName: 123 })).toContain(
      'firstName',
    );
  });

  it('applies the same rules to lastName', () => {
    expect(failedFields({ ...validPayload, lastName: 'Kowalski2' })).toContain(
      'lastName',
    );
  });
});
