import {
  RefreshTokenService,
  REFRESH_TOKEN_TTL_DAYS,
} from './refresh-token.service';

describe('RefreshTokenService', () => {
  let service: RefreshTokenService;

  beforeEach(() => {
    service = new RefreshTokenService();
  });

  it('issues a 64 character token', () => {
    const token = service.issue('user-1');

    expect(token).toHaveLength(64);
  });

  it('issues a different token every time', () => {
    const first = service.issue('user-1');
    const second = service.issue('user-1');

    expect(first).not.toBe(second);
  });

  it('returns the user id for a valid token', () => {
    const token = service.issue('user-1');

    expect(service.consume(token)).toBe('user-1');
  });

  it('returns null for an unknown token', () => {
    expect(service.consume('not-a-real-token')).toBeNull();
  });

  it('rejects a token used a second time', () => {
    const token = service.issue('user-1');
    service.consume(token);

    expect(service.consume(token)).toBeNull();
  });

  it('revokes every session of the user when reuse is detected', () => {
    const stolen = service.issue('user-1');
    const otherSession = service.issue('user-1');

    service.consume(stolen);
    service.consume(stolen);

    expect(service.consume(otherSession)).toBeNull();
  });

  it('leaves other users untouched when reuse is detected', () => {
    const stolen = service.issue('user-1');
    const unrelated = service.issue('user-2');

    service.consume(stolen);
    service.consume(stolen);

    expect(service.consume(unrelated)).toBe('user-2');
  });

  it('rejects a token past its expiry date', () => {
    jest.useFakeTimers();

    const token = service.issue('user-1');
    jest.advanceTimersByTime(
      (REFRESH_TOKEN_TTL_DAYS + 1) * 24 * 60 * 60 * 1000,
    );

    expect(service.consume(token)).toBeNull();

    jest.useRealTimers();
  });
});
