import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateParticipantDto } from './participant.dto';

describe('CreateParticipantDto', () => {
  const validPayload = {
    firstName: 'Jan',
    lastName: 'Kowalski',
    hasConsent: false,
  };

  const failedFields = (payload: Record<string, unknown>): string[] =>
    validateSync(plainToInstance(CreateParticipantDto, payload)).map(
      (error) => error.property,
    );

  it('accepts a person with nothing but a name', () => {
    expect(failedFields(validPayload)).toEqual([]);
  });

  it('accepts optional fields left empty', () => {
    expect(
      failedFields({
        ...validPayload,
        email: '',
        phone: '',
        address: '',
        note: '',
      }),
    ).toEqual([]);
  });

  it('trims spaces around the name', () => {
    const dto = plainToInstance(CreateParticipantDto, {
      ...validPayload,
      firstName: '  Jan  ',
    });

    expect(validateSync(dto)).toEqual([]);
    expect(dto.firstName).toBe('Jan');
  });

  it('rejects a name with digits', () => {
    expect(failedFields({ ...validPayload, firstName: 'Jan2' })).toContain(
      'firstName',
    );
  });

  it('accepts a proper email', () => {
    expect(
      failedFields({ ...validPayload, email: 'jan.kowalski@example.com' }),
    ).toEqual([]);
  });

  it.each([
    ['an email without @', 'jan.example.com'],
    ['an email with a space inside', 'jan @example.com'],
  ])('rejects %s', (_label, email) => {
    expect(failedFields({ ...validPayload, email })).toContain('email');
  });

  it.each([['+48 600 100 200'], ['(13) 461-00-00']])(
    'accepts the phone number %s',
    (phone) => {
      expect(failedFields({ ...validPayload, phone })).toEqual([]);
    },
  );

  it.each([
    ['letters', 'zadzwoń wieczorem'],
    ['more than 20 characters', '1'.repeat(21)],
  ])('rejects a phone number with %s', (_label, phone) => {
    expect(failedFields({ ...validPayload, phone })).toContain('phone');
  });

  it('needs an answer about consent', () => {
    expect(failedFields({ firstName: 'Jan', lastName: 'Kowalski' })).toContain(
      'hasConsent',
    );
  });
});
