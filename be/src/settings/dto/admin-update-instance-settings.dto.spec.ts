import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AdminUpdateBrandingDto } from './admin-update-instance-settings.dto';

describe('AdminUpdateBrandingDto – twitter card consistency', () => {
  it('accepts summary_large_image without app/player', async () => {
    const dto = plainToInstance(AdminUpdateBrandingDto, {
      twitter: {
        card: 'summary_large_image',
      },
    });

    const errors = await validate(dto);
    expect(errors).toEqual([]);
  });

  it('accepts twitter app card when name + id.iphone are present', async () => {
    const dto = plainToInstance(AdminUpdateBrandingDto, {
      twitter: {
        card: 'app',
        app: {
          name: 'Bee App',
          id: {
            iphone: 'bee://iphone',
          },
        },
      },
    });

    const errors = await validate(dto);
    expect(errors).toEqual([]);
  });

  it('rejects twitter app card when id.iphone is missing', async () => {
    const dto = plainToInstance(AdminUpdateBrandingDto, {
      twitter: {
        card: 'app',
        app: {
          name: 'Bee App',
          id: {
            iphone: '',
          },
        },
      },
    });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    const twitterError = errors.find((e) => e.property === 'twitter');
    expect(twitterError).toBeDefined();
    expect(twitterError?.children?.[0]?.property).toBe('card');
  });

  it('accepts twitter player card when url + width + height are present', async () => {
    const dto = plainToInstance(AdminUpdateBrandingDto, {
      twitter: {
        card: 'player',
        player: {
          url: 'https://player.example/embed',
          width: 640,
          height: 360,
        },
      },
    });

    const errors = await validate(dto);
    expect(errors).toEqual([]);
  });

  it('rejects twitter player card when width/height are missing', async () => {
    const dto = plainToInstance(AdminUpdateBrandingDto, {
      twitter: {
        card: 'player',
        player: {
          url: 'https://player.example/embed',
        },
      },
    });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    const twitterError = errors.find((e) => e.property === 'twitter');
    expect(twitterError).toBeDefined();
    expect(twitterError?.children?.[0]?.property).toBe('card');
  });
});
