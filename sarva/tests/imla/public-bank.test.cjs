const test = require('node:test');
const assert = require('node:assert/strict');
const { bank, locked } = require('../../src/renderer/src/data/seeds/imla/public-bank.json');

test('public capture keeps all accessible spelling records and locked counts separate', () => {
  assert.equal(bank.length, 122);
  assert.equal(new Set(bank.map(w => w.id)).size, bank.length);
  assert.deepEqual(Object.fromEntries(['dahom','yazdahom','davazdahom'].map(g => [g, bank.filter(w => w.grade === g).length])),
    { dahom: 44, yazdahom: 22, davazdahom: 56 });
  assert.equal(Object.keys(locked).length, 42);
  assert.equal(Object.values(locked).reduce((a, b) => a + b, 0), 690);
  for (const word of bank) {
    assert.ok(word.word && word.sentence && word.meaning && word.why);
    assert.ok(Array.isArray(word.wrong) && word.wrong.length > 0);
    assert.ok(Number.isInteger(word.lesson));
    assert.equal(locked[`${word.grade}:${word.lesson}`], undefined);
  }
});
