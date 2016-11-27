module.exports = IdbChunkStore

var IdbKvStore = require('idb-kv-store')

function IdbChunkStore (chunkLength, opts) {
  var self = this
  if (!(this instanceof IdbChunkStore)) return new IdbChunkStore(chunkLength)
  if (!opts) opts = {}

  self.chunkLength = chunkLength
  self._store = new IdbKvStore(opts.name || '' + Math.round(9e16 * Math.random()))
}

IdbChunkStore.prototype.put = function (index, buffer, cb) {
  var self = this
  if (!cb) cb = noop
  if (!self._store) return cb(new Error('Store is closed'))
  if (typeof index !== 'number') return cb(new Error('index must be a number'))
  if (!buffer) return cb(new Error('buffer must be defined'))
  if (buffer.length !== self.chunkLength) return cb(new Error('The buffer length must match the chunkLength'))
  // TODO check if buffer is actually a buffer

  self._store.set(index, buffer, cb)
}

IdbChunkStore.prototype.get = function (index, opts, cb) {
  var self = this
  if (typeof opts === 'function') return self.get(index, null, opts)
  if (typeof cb !== 'function') throw new Error('cb must be a function')
  if (!self._store) return cb(new Error('Store is closed'))
  if (typeof index !== 'number') return cb(new Error('index must be a number'))
  if (!opts) opts = {}

  self._store.get(index, function (err, buffer) {
    if (err) return cb(err)
    if (typeof buffer === 'undefined') return cb(new Error('Chunk does not exist'))
    var offset = 'offset' in opts ? opts.offset : 0
    var length = 'length' in opts ? opts.length : buffer.length - offset
    cb(null, buffer.slice(offset, offset + length))
  })
}

IdbChunkStore.prototype.close = function (cb) {
  var self = this
  if (!cb) cb = noop
  if (!self._store) return cb(new Error('Store is closed'))

  self._store = null
  cb(null)
}

IdbChunkStore.prototype.destroy = function (cb) {
  var self = this
  if (!cb) cb = noop
  if (!self._store) return cb(new Error('Store is closed'))

  var s = self._store
  self._store = null
  s.clear(cb)
}

function noop () {
  // do nothing
}
