import { TrainingService } from './training.service';

describe('TrainingService', () => {
  let service: TrainingService;

  beforeEach(() => {
    service = new TrainingService();
  });

  it('ping returns pong with timestamp', () => {
    const res = service.ping();

    expect(res).toHaveProperty('message', 'pong');
    expect(typeof res.timestamp).toBe('string');
    expect(new Date(res.timestamp).toString()).not.toBe('Invalid Date');
  });

  it('echo returns value with receivedAt and requestId', () => {
    const value = { foo: 'bar' };

    const res = service.echo(value);

    expect(res.value).toEqual(value);
    expect(typeof res.receivedAt).toBe('string');
    expect(new Date(res.receivedAt).toString()).not.toBe('Invalid Date');
    expect(typeof res.requestId).toBe('string');
    expect(res.requestId.length).toBeGreaterThan(0);
  });
});
