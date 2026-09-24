import { pointsForDrink } from '../data/drinks'

// Free-text "Drink" cell -> our { type, amount } shape. Checks the more
// specific words first since e.g. "shotgun" contains "shot".
export function parseDrinkText(text) {
  const t = String(text || '').trim().toLowerCase()
  if (t.includes('shotgun')) return { type: 'shotgun', amount: 1 }
  if (t.includes('finish')) return { type: 'finish', amount: 1 }
  if (t.includes('shot')) return { type: 'shot', amount: 1 }
  const countMatch = t.match(/(\d+)/)
  return { type: 'count', amount: countMatch ? Math.max(1, Number(countMatch[1])) : 1 }
}

function getField(row, ...names) {
  const keys = Object.keys(row)
  for (const name of names) {
    const key = keys.find((k) => k.trim().toLowerCase() === name)
    if (key !== undefined && row[key] !== undefined && row[key] !== '') return row[key]
  }
  return undefined
}

// Reads an .xlsx or .csv File and returns { events, warnings }. Expected
// columns (case-insensitive, a few aliases accepted): Card Name, Drink,
// Points (optional — defaults to the standard formula for that drink type),
// Card Count. A "Kind"/"Type" column set to "multiplier" plus a "Factor"
// column marks a multiplier card instead of a scored one.
export async function parseSpreadsheetToEvents(file) {
  // Lazy-loaded: xlsx is a large library only admins importing a deck need —
  // keeping it out of the main bundle so regular gameplay stays light.
  const XLSX = await import('xlsx')
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })

  const warnings = []
  const events = []

  rows.forEach((row, i) => {
    const label = getField(row, 'card name', 'name', 'event', 'label')
    if (!label) {
      warnings.push(`Row ${i + 2}: skipped — no card name.`)
      return
    }

    const kindRaw = getField(row, 'kind', 'type')
    const isMultiplier = String(kindRaw || '').trim().toLowerCase() === 'multiplier'

    if (isMultiplier) {
      const factorRaw = getField(row, 'factor', 'multiplier')
      const factor = Number(factorRaw) || 2
      events.push({
        id: `evt-${Math.random().toString(36).slice(2, 8)}`,
        kind: 'multiplier',
        label: String(label),
        factor,
        cardCount: Number(getField(row, 'card count', 'cards', 'count')) || 1,
      })
      return
    }

    const drinkText = getField(row, 'drink', 'drink type', 'result')
    const drink = parseDrinkText(drinkText)
    const pointsRaw = getField(row, 'points', 'point')
    const points = pointsRaw !== undefined && pointsRaw !== '' ? Number(pointsRaw) : pointsForDrink(drink)
    const cardCount = Number(getField(row, 'card count', 'cards', 'count'))

    events.push({
      id: `evt-${Math.random().toString(36).slice(2, 8)}`,
      kind: 'score',
      label: String(label),
      drink,
      points: Number.isFinite(points) ? points : pointsForDrink(drink),
      cardCount: Number.isFinite(cardCount) ? cardCount : 1,
    })
  })

  if (events.length === 0) {
    warnings.push('No usable rows found — check the header row has a "Card Name" column.')
  }

  return { events, warnings }
}

function baseName(filename) {
  return filename.replace(/\.[^./]+$/, '').replace(/[_-]+/g, ' ').trim()
}

// Single entry point for the admin importers: reads a .json deck export or a
// .xlsx/.csv card list and returns a deck-shaped object ready to drop into
// the editor. Never touches Firestore — the caller decides when to save.
export async function importDeckFile(file) {
  const ext = file.name.split('.').pop().toLowerCase()

  if (ext === 'json') {
    const text = await file.text()
    let data
    try {
      data = JSON.parse(text)
    } catch {
      throw new Error('That file isn’t valid JSON.')
    }
    if (!data.name || !Array.isArray(data.events)) {
      throw new Error('File needs a "name" and an "events" array.')
    }
    return { ...data, warnings: [] }
  }

  if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
    const { events, warnings } = await parseSpreadsheetToEvents(file)
    return { name: baseName(file.name), emoji: '🎲', description: '', events, warnings }
  }

  throw new Error('Unsupported file type — use .json, .xlsx, or .csv.')
}
