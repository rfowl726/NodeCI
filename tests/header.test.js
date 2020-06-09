//JEST test file for testing header.
const Page = require('./helpers/page');

let page;
jest.setTimeout(30000);

beforeEach(async () => {
	page = await Page.build();
	await page.goto('http://localhost:3000');
});

afterEach(async () => {
	await page.close();
})

test('the header has the correct text', async () => {
//	const text = await page.$eval('a.brand-logo', el => el.innerHTML);
	const text = await page.getContentsOf('a.brand-logo');
	expect(text).toEqual('Blogster');
});

test('clicking login starts oauth flow', async () => {
	await page.click('.right a');
	const url = await page.url();
	expect(url).toMatch(/accounts\.google\.com/);
	
})

test('When signed in, shows logout button', async () => {
//	const id = '5ec3fd67a2f61db90bebfa28';
	await page.login();	
//	const text = await page.$eval('a[href="/auth/logout"]', el => el.innerHTML);
	const text = await page.getContentsOf('a[href="/auth/logout"]');
	expect(text).toEqual('Logout');
});

