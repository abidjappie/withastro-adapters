import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { astroCli, wranglerCli } from './_test-utils.js';

const root = new URL('./fixtures/wasm-directory/', import.meta.url);

describe('WasmDirectoryImport', () => {
	let wrangler;
	before(async () => {
		await astroCli(fileURLToPath(root), 'build');

		wrangler = wranglerCli(fileURLToPath(root));
		await new Promise((resolve) => {
			wrangler.stdout.on('data', (data) => {
				// console.log('[stdout]', data.toString());
				if (data.toString().includes('http://127.0.0.1:8788')) resolve();
			});
			wrangler.stderr.on('data', (data) => {
				// console.log('[stderr]', data.toString());
			});
		});
	});

	after((done) => {
		wrangler.kill();
		setTimeout(() => {
			// console.log('CLEANED');
			done();
		}, 1000);
	});

	it('can render', async () => {
		const res = await fetch('http://127.0.0.1:8788/');
		assert.equal(res.status, 200);
		const json = await res.json();
		assert.deepEqual(json, { answer: 42 });
	});
});
