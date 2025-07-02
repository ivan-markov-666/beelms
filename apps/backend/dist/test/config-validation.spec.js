"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const config_1 = require("@nestjs/config");
const validation_1 = require("../src/config/validation");
describe('Environment configuration validation', () => {
    const ORIGINAL_ENV = { ...process.env };
    afterEach(() => {
        process.env = { ...ORIGINAL_ENV };
    });
    it('throws when DATABASE_URL is missing', async () => {
        process.env = { ...ORIGINAL_ENV };
        delete process.env.DATABASE_URL;
        await expect(testing_1.Test.createTestingModule({
            imports: [
                config_1.ConfigModule.forRoot({
                    isGlobal: true,
                    validationSchema: validation_1.validationSchema,
                }),
            ],
        }).compile()).rejects.toThrow();
    });
    it('throws when DATABASE_URL is not a valid URI', async () => {
        process.env = { ...ORIGINAL_ENV, DATABASE_URL: 'not-a-valid-uri' };
        await expect(testing_1.Test.createTestingModule({
            imports: [
                config_1.ConfigModule.forRoot({
                    isGlobal: true,
                    validationSchema: validation_1.validationSchema,
                }),
            ],
        }).compile()).rejects.toThrow();
    });
});
//# sourceMappingURL=config-validation.spec.js.map