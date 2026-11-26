import test from 'node:test';
import assert from 'node:assert/strict';
import { generators, esc, lowerThird, badge } from '../vectorcraft/index.mjs';
import { parseArgs } from '../vectorcraft/cli.mjs';

test('esc escapes XML special characters', () => {
  assert.equal(esc(`<a href="x">&'`), '&lt;a href=&quot;x&quot;&gt;&amp;&apos;');
});

test('every generator returns a well-formed svg root', () => {
  const samples = {
    'lower-third': { title: 'A', subtitle: 'B' },
    badge: { text: 'NEW' },
    arrow: {},
    underline: {},
    'circle-highlight': {},
  };
  for (const [name, gen] of Object.entries(generators)) {
    const out = gen(samples[name]);
    assert.match(out, /^<svg [^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/, name);
    assert.match(out, /<\/svg>\n$/, name);
  }
});

test('user text is escaped, not injected', () => {
  const out = lowerThird({ title: '<script>alert(1)</script>' });
  assert.ok(!out.includes('<script>'));
  assert.ok(out.includes('&lt;script&gt;'));
});

test('missing required text throws', () => {
  assert.throws(() => lowerThird({}), /title/);
  assert.throws(() => badge({}), /text/);
});

test('non-numeric size throws', () => {
  assert.throws(() => generators.arrow({ length: 'abc' }), /length must be a number/);
});

test('parseArgs converts kebab flags to camelCase and rejects bad input', () => {
  assert.deepEqual(parseArgs(['--font-size', '30', '--text', 'hi']), { fontSize: '30', text: 'hi' });
  assert.throws(() => parseArgs(['--text']), /needs a value/);
  assert.throws(() => parseArgs(['oops']), /unexpected argument/);
});
