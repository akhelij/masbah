// Node 20 lacks Object.groupBy (shipped in Node 21). Some tooling
// (eslint-flat-config-utils) relies on it. No-op on Node 22+ (CI / Vercel).
if (typeof Object.groupBy !== 'function') {
  Object.defineProperty(Object, 'groupBy', {
    configurable: true,
    writable: true,
    value(items, callback) {
      const result = Object.create(null)
      let index = 0
      for (const item of items) {
        const key = callback(item, index++)
        if (Object.prototype.hasOwnProperty.call(result, key)) result[key].push(item)
        else result[key] = [item]
      }
      return result
    },
  })
}
