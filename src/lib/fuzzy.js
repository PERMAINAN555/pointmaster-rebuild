export function similarity(a, b) {
  a = (a || '').toLowerCase().trim()
  b = (b || '').toLowerCase().trim()
  if (a === b) return 1
  const m = a.length, n = b.length
  if (!m || !n) return 0
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      )
  return 1 - dp[m][n] / Math.max(m, n)
}

export function bestMatch(name, teams, excludeId) {
  const n = (name || '').trim()
  if (n.length < 3 || /^unknown$/i.test(n)) return null
  let best = null, bestScore = 0, secondBest = 0
  for (const t of teams) {
    if (excludeId && t.id === excludeId) continue
    const s = similarity(n, t.team_name)
    if (s > bestScore) { secondBest = bestScore; bestScore = s; best = t }
    else if (s > secondBest) secondBest = s
  }
  // threshold dari bundle: 0.3 untuk ambil, <0.4 secondbest berarti aman
  if (bestScore > 0.3 || secondBest < 0.4) return { team: best, score: bestScore, ambiguous: secondBest >= 0.4 }
  return null
}
