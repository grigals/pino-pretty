'use strict'

const tap = require('tap')
const prettifyObject = require('./prettify-object')

tap.test('returns empty string if no properties present', async t => {
  const str = prettifyObject({ input: {} })
  t.equal(str, '')
})

tap.test('works with single level properties', async t => {
  const str = prettifyObject({ input: { foo: 'bar' } })
  t.equal(str, '    foo: "bar"\n')
})

tap.test('works with multiple level properties', async t => {
  const str = prettifyObject({ input: { foo: { bar: 'baz' } } })
  t.equal(str, '    foo: {\n      "bar": "baz"\n    }\n')
})

tap.test('skips specified keys', async t => {
  const str = prettifyObject({ input: { foo: 'bar', hello: 'world' }, skipKeys: ['foo'] })
  t.equal(str, '    hello: "world"\n')
})

tap.test('ignores predefined keys', async t => {
  const str = prettifyObject({ input: { foo: 'bar', pid: 12345 } })
  t.equal(str, '    foo: "bar"\n')
})

tap.test('ignores escaped backslashes in string values', async t => {
  const str = prettifyObject({ input: { foo_regexp: '\\[^\\w\\s]\\' } })
  t.equal(str, '    foo_regexp: "\\[^\\w\\s]\\"\n')
})

tap.test('ignores escaped backslashes in string values (singleLine option)', async t => {
  const str = prettifyObject({ input: { foo_regexp: '\\[^\\w\\s]\\' }, singleLine: true })
  t.equal(str, '{"foo_regexp":"\\[^\\w\\s]\\"}\n')
})

tap.test('works with error props', async t => {
  const err = Error('Something went wrong')
  const serializedError = {
    message: err.message,
    stack: err.stack
  }
  const str = prettifyObject({ input: { error: serializedError } })
  t.ok(str.startsWith('    error:'))
  t.ok(str.includes('     "message": "Something went wrong",'))
  t.ok(str.includes('         Error: Something went wrong'))
})

tap.test('customPrettifiers gets applied', async t => {
  const customPrettifiers = {
    foo: v => v.toUpperCase()
  }
  const str = prettifyObject({ input: { foo: 'foo' }, customPrettifiers })
  t.equal(str.startsWith('    foo: FOO'), true)
})

tap.test('skips lines omitted by customPrettifiers', async t => {
  const customPrettifiers = {
    foo: () => { return undefined }
  }
  const str = prettifyObject({ input: { foo: 'foo', bar: 'bar' }, customPrettifiers })
  t.equal(str.includes('bar: "bar"'), true)
  t.equal(str.includes('foo: "foo"'), false)
})

tap.test('joined lines omits starting eol', async t => {
  const str = prettifyObject({
    input: { msg: 'doing work', calls: ['step 1', 'step 2', 'step 3'], level: 30 },
    ident: '',
    customPrettifiers: {
      calls: val => '\n' + val.map(it => '  ' + it).join('\n')
    }
  })
  t.equal(str, [
    'msg: "doing work"',
    'calls:',
    '  step 1',
    '  step 2',
    '  step 3',
    ''
  ].join('\n'))
})

tap.test('errors skips prettifiers', async t => {
  const customPrettifiers = {
    err: () => { return 'is_err' }
  }
  const str = prettifyObject({ input: { err: Error('boom') }, customPrettifiers })
  t.equal(str.includes('err: is_err'), true)
})

tap.test('errors skips prettifying if no lines are present', async t => {
  const customPrettifiers = {
    err: () => { return undefined }
  }
  const str = prettifyObject({ input: { err: Error('boom') }, customPrettifiers })
  t.equal(str, '')
})