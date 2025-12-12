import { TrainingService } from './training.service';

describe('TrainingService', () => {
  let service: TrainingService;

  beforeEach(() => {
    service = new TrainingService();
  });

  it('ping returns ok status', () => {
    expect(service.ping()).toEqual({ status: 'ok' });
  });

  it('echo returns the same body that was passed in', () => {
    const payload = { message: 'hello', value: 42 };
    expect(service.echo(payload)).toEqual(payload);
  });
});
