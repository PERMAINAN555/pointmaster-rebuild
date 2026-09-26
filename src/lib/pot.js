const LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function splitPots(teams, perPot) {
  const s = shuffle(teams)
  const pots = []
  for (let i = 0; i < s.length; i += perPot) pots.push(s.slice(i, i + perPot))
  return pots
}

export function potLabel(i) { return LABELS[i] || String(i + 1) }
