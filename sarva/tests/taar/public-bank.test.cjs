const test=require('node:test'),assert=require('node:assert/strict');
const catalog=require('../../src/renderer/src/data/seeds/taar/public-catalog.json');
const data=require('../../src/renderer/src/data/seeds/taar/public-bank.json');
test('anonymous Taar verse data matches public catalog',()=>{assert.equal(data.requested,404);assert.deepEqual(data.errors,[]);assert.equal(data.bank.length,404);assert.equal(new Set(data.bank.map(b=>b.key)).size,404);assert.deepEqual(new Set(data.bank.map(b=>b.key)),new Set(catalog.map(x=>x.key)));for(const b of data.bank){assert.equal(b.hemis.length,2);for(const h of b.hemis){assert.ok(h.text);assert.ok(h.syllables.length);for(const s of h.syllables){assert.ok(s.text);assert.ok(['short','long'].includes(s.length));assert.equal(typeof s.foot,'number')}}}});
