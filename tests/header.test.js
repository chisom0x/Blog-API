const puppeteer = require('puppeteer')
const sessionFactory = require('./factories/sessionFactory');
const userFactory = require('./factories/userFactory')
const { session } = require('passport');
jest.setTimeout(100000); // Set the timeout to 10 seconds

let browser, page;

beforeEach(async()=>{
     browser = await puppeteer.launch({
        headless: false
    })
     page = await browser.newPage();
    await page.goto('localhost:3000')
})

afterEach(async ()=>{
 await browser.close()
})

test('header has correct test', async ()=>{
    const text = await page.$eval('a.brand-logo', el => el.innerHTML)
     expect(text).toEqual('Blogster')
});

test('clicking login starts oauth flow', async ()=>{
   await page.click('.right a')
   const url = await page.url()
   expect(url).toMatch(/accounts\.google\.com/)
});

test('when signed in, show logout button', async () => {
    const user = await userFactory()
    const {session, sig} = sessionFactory(user)
 
    await page.setCookie({ name: 'session', value: session }); // Set the sessionString as the value
    await page.setCookie({ name: 'session.sig', value: sig });
 
    await page.goto('http://localhost:3000'); // You need to specify the protocol (http) here
     await page.waitFor('a[href="/auth/logout"]');
   const text =  await page.$eval('a[href="/auth/logout"]', el => el.innerHTML)
   expect(text).toEqual('Logout')
});

 