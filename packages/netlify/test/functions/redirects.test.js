import { createServer } from 'http';
import { loadFixture } from '@astrojs/test-utils';
import { expect } from 'chai';
import { describe, it, before } from 'node:test';
import * as assert from 'node:assert/strict';

describe('SSR - Redirects', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: new URL('./fixtures/redirects/', import.meta.url) });
		await fixture.build();
	});

	it('Creates a redirects file', async () => {
		const redirects = await fixture.readFile('./_redirects');
		const parts = redirects.split(/\s+/);
		assert.deepEqual(parts,['', '/other', '/', '301', '']);
		// TODO: not sure how to implement snapshot testing yet
		expect(redirects).to.matchSnapshot();
	});

	it('Does not create .html files', async () => {
		let hasErrored = false;
		try {
			await fixture.readFile('/other/index.html');
		} catch {
			hasErrored = true;
		}
		assert.equal(hasErrored,true, 'this file should not exist');
	});

	it('renders static 404 page', async () => {
		const entryURL = new URL(
			'./fixtures/redirects/.netlify/functions-internal/ssr/ssr.mjs',
			import.meta.url
		);
		const { default: handler } = await import(entryURL);
		const resp = await handler(new Request('http://example.com/nonexistant-page'), {});
		assert.equal(resp.status,404);
		const text = await resp.text();
		assert.equal(text.includes('This is my static 404 page'),true);
	});

	it('does not pass through 404 request', async () => {
		let testServerCalls = 0;
		const testServer = createServer((req, res) => {
			testServerCalls++;
			res.writeHead(200);
			res.end();
		});
		testServer.listen(5678);
		const entryURL = new URL(
			'./fixtures/redirects/.netlify/functions-internal/ssr/ssr.mjs',
			import.meta.url
		);
		const { default: handler } = await import(entryURL);
		const resp = await handler(new Request('http://localhost:5678/nonexistant-page'), {});
		assert.equal(resp.status,404);
		assert.equal(testServerCalls,0);
		testServer.close();
	});
});
