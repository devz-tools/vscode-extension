import * as assert from 'assert';
import * as vscode from 'vscode';
import { showAutoHideNotification } from '../utils';

/**
 * Main extension test suite
 */
suite('DevZ Tools Extension Test Suite', () => {
	showAutoHideNotification('Running DevZ Tools tests...', 'info', 2000);

	test('Extension should be present', () => {
		const extension = vscode.extensions.getExtension('devz-tools.devz-tools');
		assert.ok(extension, 'DevZ Tools extension should be installed');
	});

	test('Extension should activate', async () => {
		const extension = vscode.extensions.getExtension('devz-tools.devz-tools');
		if (extension && !extension.isActive) {
			await extension.activate();
		}
		assert.ok(extension?.isActive, 'Extension should be active');
	});

	test('Commands should be registered', async () => {
		const commands = await vscode.commands.getCommands();
		const devzCommands = commands.filter(cmd => cmd.startsWith('devz-tools.'));

		// Expected commands
		const expectedCommands = [
			'devz-tools.packPBO',
			'devz-tools.startServerAndClient',
			'devz-tools.wipeServerData',
			'devz-tools.wipeClientData',
			'devz-tools.openClientDirectory',
			'devz-tools.openServerDirectory',
			'devz-tools.openToolsDirectory',
			'devz-tools.openProjectDriveDirectory',
			'devz-tools.openWorkshopDirectory',
			'devz-tools.showModsSummary'
		];

		expectedCommands.forEach(expectedCmd => {
			assert.ok(devzCommands.includes(expectedCmd),
				`Command '${expectedCmd}' should be registered`);
		});
	});

	test('Configuration should be available', () => {
		const config = vscode.workspace.getConfiguration('devz-tools');
		assert.ok(config, 'DevZ Tools configuration should be available');

		// Test default configuration values
		const modName = config.get('modName');
		const enableTooltips = config.get('enableModTooltips');

		assert.ok(typeof modName === 'string', 'modName should be a string');
		assert.ok(typeof enableTooltips === 'boolean', 'enableModTooltips should be a boolean');
	});

	test('Array helper methods should work correctly', () => {
		// Test basic array operations that might be used in the extension
		const testArray = [1, 2, 3, 4, 5];

		assert.strictEqual(testArray.indexOf(3), 2);
		assert.strictEqual(testArray.indexOf(99), -1);
		assert.strictEqual(testArray.length, 5);

		const filteredArray = testArray.filter(n => n > 3);
		assert.strictEqual(filteredArray.length, 2);
		assert.deepStrictEqual(filteredArray, [4, 5]);
	});
});
