import * as assert from 'assert';
import * as vscode from 'vscode';

/**
 * Test suite for utility functions and core functionality
 */
suite('DevZ Tools Test Suite', () => {

    test('Extension should be present', () => {
        assert.ok(vscode.extensions.getExtension('devz-tools.devz-tools'));
    });

    test('Basic type validation', () => {
        // Test that our interfaces can be constructed
        const mockSettings = {
            dayzClientDir: 'test',
            dayzServerDir: 'test',
            dayzToolsDir: 'test',
            dayzProjectDir: 'test',
            modName: 'test',
            serverAddress: 'test',
            additionalMods: [],
            steamWorkshopDir: 'test',
            enableModTooltips: true
        };

        assert.ok(mockSettings);
        assert.strictEqual(mockSettings.modName, 'test');
        assert.ok(Array.isArray(mockSettings.additionalMods));
    });

    test('ModInfo interface validation', () => {
        const mockModInfo = {
            id: '12345',
            name: 'Test Mod',
            path: '/path/to/mod',
            isWorkshop: true,
            size: 1024,
            workshopUrl: 'https://example.com'
        };

        assert.ok(mockModInfo);
        assert.strictEqual(mockModInfo.id, '12345');
        assert.strictEqual(mockModInfo.isWorkshop, true);
        assert.strictEqual(mockModInfo.size, 1024);
    });

    test('ValidationResult interface validation', () => {
        const mockValidationResult = {
            isValid: true,
            errors: ['error1', 'error2'],
            warnings: ['warning1']
        };

        assert.ok(mockValidationResult);
        assert.strictEqual(mockValidationResult.isValid, true);
        assert.strictEqual(mockValidationResult.errors.length, 2);
        assert.strictEqual(mockValidationResult.warnings.length, 1);
    });

    test('Configuration should be accessible', () => {
        const config = vscode.workspace.getConfiguration('devz-tools');
        assert.ok(config);

        // Test that configuration properties are accessible (with defaults)
        const modName = config.get('modName', 'DefaultMod');
        const enableTooltips = config.get('enableModTooltips', true);

        assert.ok(typeof modName === 'string');
        assert.ok(typeof enableTooltips === 'boolean');
    });
});