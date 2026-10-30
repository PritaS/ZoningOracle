const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { handler } = require('../netlify/functions/zoning.js');
const originalFetch = global.fetch;
const savedEnv = { ...process.env };
afterEach(() => { global.fetch = originalFetch; process.env = { ...savedEnv }; });
const event = body => ({httpMethod:'POST', body:JSON.stringify(body)});
test('method and invalid input rejected before calling provider', async () => {
  global.fetch = () => { throw Error('must not fetch'); };
  assert.equal((await handler({httpMethod:'GET'})).statusCode,405);
  assert.equal((await handler({httpMethod:'POST',body:'{'})).statusCode,400);
  for (const body of [null, [], {}, {address:'a',county:'CA'}]) assert.equal((await handler(event(body))).statusCode,400);
});
test('configuration fails closed', async () => {
  delete process.env.ACTIONFORGE_TOOL_ID;
  assert.equal((await handler(event({address:'123 Main',county:'Orange'}))).statusCode,503);
});
test('valid requests send trimmed fields and do not expose upstream errors', async () => {
  process.env.ACTIONFORGE_TOOL_ID='tool_123'; process.env.ACTIONFORGE_KEY='test';
  global.fetch=async (url, options) => {
    assert.equal(url,'https://api.actionforge.com/api/invoke/tool_123');
    assert.deepEqual(JSON.parse(options.body),{address:'123 Main',county:'Orange'});
    assert.ok(options.signal); return {ok:true,json:async()=>({result:{zoning_code:'R1'}})};
  };
  assert.equal((await handler(event({address:' 123 Main ',county:' Orange '}))).statusCode,200);
  global.fetch=async()=>({ok:false,status:401,text:async()=>'private provider detail'});
  const response=await handler(event({address:'123 Main',county:'Orange'}));
  assert.equal(response.statusCode,502); assert.ok(!response.body.includes('private'));
});
test('abort maps to gateway timeout', async () => {
  process.env.ACTIONFORGE_TOOL_ID='tool_123'; process.env.ACTIONFORGE_KEY='test';
  global.fetch=async()=>{ const e=new Error('aborted');e.name='AbortError';throw e; };
  assert.equal((await handler(event({address:'123 Main',county:'Orange'}))).statusCode,504);
});
