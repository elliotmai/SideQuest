/*
 * The Firestore calls SideQuest makes, answered by Supabase.
 *
 * SideQuest moved from Firebase (project sidequest-42196) to Hive's Supabase
 * project, schema `sidequest`: one row per document in sidequest.docs, keyed
 * by its full path ('sessions/7F3K9Q/players/<uid>'). This keeps the calls the
 * app uses — collection, doc, query, where (==, array-contains), orderBy,
 * getDoc, getDocs, onSnapshot, setDoc, addDoc, updateDoc, deleteDoc,
 * writeBatch, serverTimestamp, increment, arrayUnion, arrayRemove,
 * deleteField. updateDoc runs in one step on the server (sidequest.update), so
 * two players scoring at once both count. The database applies the old rules.
 */
import { sidequest, supabase } from '../supabase'
import { Timestamp, decode, encode } from './timestamp'

export { Timestamp }
export const getFirestore = () => ({ kind: 'db' })

const newId = () => crypto.randomUUID().replace(/-/g, '').slice(0, 20)
const join = (parts) => parts.flatMap((p) => String(p).split('/')).filter(Boolean).join('/')

/** collection(db, 'sessions', code, 'players') */
export function collection(base, ...segments) {
  return { kind: 'col', path: join([...(base?.path ? [base.path] : []), ...segments]) }
}

/** doc(db, 'users', uid) · doc(colRef) (new id) · doc(colRef, id) */
export function doc(base, ...segments) {
  let path = join([...(base?.path ? [base.path] : []), ...segments])
  if (base?.kind === 'col' && segments.length === 0) path = `${base.path}/${newId()}`
  return { kind: 'doc', path, id: path.split('/').pop() }
}

export const where = (field, op, value) => ({ type: 'where', field, op, value })
export const orderBy = (field, dir = 'asc') => ({ type: 'orderBy', field, dir })
export const query = (col, ...parts) => ({
  kind: 'query',
  path: col.path,
  wheres: parts.filter((p) => p.type === 'where'),
  orders: parts.filter((p) => p.type === 'orderBy'),
})

// ── markers ──
const mark = (op, value) => ({ __op: op, value })
export const serverTimestamp = () => mark('now')
export const deleteField = () => mark('delete')
export const increment = (n) => mark('increment', n)
export const arrayUnion = (...items) => mark('union', items)
export const arrayRemove = (...items) => mark('remove', items)

const isPlain = (v) => v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Timestamp) && !(v instanceof Date)

/** Markers resolved for a whole new document (no current value). */
function resolve(v) {
  if (v?.__op === 'now') return Timestamp.now()
  if (v?.__op === 'increment') return v.value
  if (v?.__op === 'union') return [...new Map(v.value.map((x) => [JSON.stringify(x), x])).values()]
  if (v?.__op === 'remove') return []
  if (isPlain(v)) {
    const out = {}
    for (const [k, x] of Object.entries(v)) if (x !== undefined && x?.__op !== 'delete') out[k] = resolve(x)
    return out
  }
  if (Array.isArray(v)) return v.map(resolve)
  return v
}

const fail = (error) => {
  if (error) throw Object.assign(new Error(error.message), { code: error.code === '42501' ? 'permission-denied' : error.code })
}

// ── reading ──
function snapDoc(path, row) {
  const ref = { kind: 'doc', path, id: path.split('/').pop() }
  const fields = row ? decode(row.data) : undefined
  return { id: ref.id, ref, exists: () => Boolean(row), data: () => (fields ? { ...fields } : undefined) }
}

const sortValue = (v) => (v && typeof v.toMillis === 'function' ? v.toMillis() : v ?? '')

async function run(q) {
  let req = sidequest.from('docs').select('path, data').eq('parent', q.path)
  for (const w of q.wheres) {
    if (w.op === '==') req = req.eq(`data->>${w.field}`, typeof w.value === 'string' ? w.value : JSON.stringify(w.value))
    else if (w.op === 'array-contains') req = req.filter(`data->${w.field}`, 'cs', JSON.stringify([w.value]))
    else throw new Error(`where op ${w.op} is not supported`)
  }
  const { data, error } = await req
  fail(error)
  let docs = data.map((r) => snapDoc(r.path, r))
  for (const o of [...(q.orders || [])].reverse()) {
    docs = docs.filter((d) => d.data()[o.field] !== undefined)
    docs.sort((a, b) => {
      const x = sortValue(a.data()[o.field]), y = sortValue(b.data()[o.field])
      return (x > y ? 1 : x < y ? -1 : 0) * (o.dir === 'desc' ? -1 : 1)
    })
  }
  return docs
}

const snapshot = (docs) => ({ docs, empty: docs.length === 0, size: docs.length, forEach: (fn) => docs.forEach(fn) })
const asQuery = (q) => (q.kind === 'col' ? { path: q.path, wheres: [], orders: [] } : q)

export async function getDocs(q) {
  return snapshot(await run(asQuery(q)))
}

export async function getDoc(ref) {
  const { data, error } = await sidequest.from('docs').select('path, data').eq('path', ref.path).maybeSingle()
  fail(error)
  return snapDoc(ref.path, data)
}
export const getDocFromServer = getDoc

let seq = 0

/** Answers now, then whenever the document (or a document in the collection) changes. */
export function onSnapshot(target, next, onError) {
  const isDoc = target.kind === 'doc'
  let live = true
  let running = false
  let again = false
  const refresh = async () => {
    if (running) return void (again = true)
    running = true
    try {
      const s = isDoc ? await getDoc(target) : await getDocs(target)
      if (live) next(s)
    } catch (err) {
      if (live) onError ? onError(err) : console.warn('[sidequest]', err.message)
    }
    running = false
    if (again && live) {
      again = false
      refresh()
    }
  }
  refresh()
  const filter = isDoc ? `path=eq.${target.path}` : `parent=eq.${target.path}`
  const channel = supabase
    .channel(`sq-${++seq}`)
    .on('postgres_changes', { event: '*', schema: 'sidequest', table: 'docs', filter }, refresh)
    .subscribe()
  const onVisible = () => {
    if (!document.hidden) refresh()
  }
  document.addEventListener('visibilitychange', onVisible)
  return () => {
    live = false
    document.removeEventListener('visibilitychange', onVisible)
    supabase.removeChannel(channel)
  }
}

// ── writing ──
export async function addDoc(col, fields) {
  const ref = doc(col)
  const { error } = await sidequest.from('docs').insert({ path: ref.path, data: encode(resolve(fields)) })
  fail(error)
  return ref
}

/** Field operations for sidequest.update, from a Firestore-style patch. */
function opsFor(changes, prefix = [], nested = false) {
  const ops = []
  for (const [key, v] of Object.entries(changes)) {
    if (v === undefined) continue
    const path = [...prefix, ...(nested ? [key] : key.split('.'))]
    if (v?.__op === 'now') ops.push({ path, op: 'now' })
    else if (v?.__op === 'delete') ops.push({ path, op: 'delete' })
    else if (v?.__op) ops.push({ path, op: v.__op, value: encode(v.value) })
    else if (nested && isPlain(v)) ops.push(...opsFor(v, path, true))
    else ops.push({ path, op: 'set', value: encode(resolve(v)) })
  }
  return ops
}

export async function updateDoc(ref, changes) {
  const { error } = await sidequest.rpc('update', { doc_path: ref.path, ops: opsFor(changes) })
  fail(error)
}

export async function setDoc(ref, fields, options = {}) {
  if (options.merge) {
    const existing = await getDoc(ref)
    if (existing.exists()) return void (await sidequest.rpc('update', { doc_path: ref.path, ops: opsFor(fields, [], true) }).then(({ error }) => fail(error)))
  }
  const { error } = await sidequest.from('docs').upsert({ path: ref.path, data: encode(resolve(fields)) }, { onConflict: 'path' })
  fail(error)
}

export async function deleteDoc(ref) {
  const { error } = await sidequest.from('docs').delete().eq('path', ref.path)
  fail(error)
}

/** Runs the queued writes in order when committed. */
export function writeBatch() {
  const ops = []
  const batch = {
    set: (ref, data, options) => (ops.push(() => setDoc(ref, data, options)), batch),
    update: (ref, data) => (ops.push(() => updateDoc(ref, data)), batch),
    delete: (ref) => (ops.push(() => deleteDoc(ref)), batch),
    async commit() {
      for (const op of ops) await op()
    },
  }
  return batch
}

/**
 * runTransaction(db, async (tx) => { … tx.get(ref) … tx.update(ref, …) }):
 * the writes go through only if nothing tx.get read has changed since
 * (sidequest.commit checks); otherwise it reads again and retries.
 */
export async function runTransaction(_db, fn, { maxAttempts = 6 } = {}) {
  for (let attempt = 1; ; attempt++) {
    const reads = new Map()
    const writes = []
    const tx = {
      async get(ref) {
        const { data, error } = await sidequest.from('docs').select('path, data, updated_at').eq('path', ref.path).maybeSingle()
        fail(error)
        reads.set(ref.path, data ? data.updated_at : null)
        return snapDoc(ref.path, data)
      },
      update: (ref, changes) => (writes.push({ path: ref.path, kind: 'update', ops: opsFor(changes) }), tx),
      set: (ref, data) => (writes.push({ path: ref.path, kind: 'set', data: encode(resolve(data)) }), tx),
      delete: (ref) => (writes.push({ path: ref.path, kind: 'delete' }), tx),
    }
    const result = await fn(tx)
    const { error } = await sidequest.rpc('commit', {
      reads: [...reads].map(([path, version]) => ({ path, version })),
      writes,
    })
    if (!error) return result
    if (error.code !== 'PT409' || attempt >= maxAttempts) fail(error)
    await new Promise((r) => setTimeout(r, 40 * attempt + Math.random() * 60))
  }
}
