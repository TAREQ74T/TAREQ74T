/**
 * BC-014c synthetic tests against 177db01 handler logic.
 * Mirrors src/hooks/useDeviceOrientation.ts (no React).
 * Run: node docs/evidence/BC-014c/synthetic-test.mjs
 */

const DEBUG_SAMPLE_LIMIT = 150
const DEBUG_SAMPLE_MIN_INTERVAL_MS = 100

function resolveBranch(event) {
  if (typeof event.webkitCompassHeading === 'number') {
    return 'webkit'
  }
  if (event.type === 'deviceorientationabsolute') {
    return 'absolute'
  }
  return 'relative'
}

function createEngine({ debug = true, android = true } = {}) {
  const state = {
    heading: null,
    hasReceivedAbsolute: false,
    smoothing: [],
    alphaRaw: null,
    beta: null,
    gamma: null,
    branch: null,
    absCount: 0,
    relCount: 0,
    screenAngle: null,
    eventAbsolute: null,
    rawHeading: null,
    lastIgnoredRelativeAlpha: null,
    headingRef: null,
    samples: [],
    lastSampleAtByType: {},
    now: 1000,
  }

  function isAndroidUserAgent() {
    return android
  }

  function handle(event) {
    let raw = null
    if (typeof event.webkitCompassHeading === 'number') {
      raw = event.webkitCompassHeading
    }

    if (raw == null && typeof event.alpha === 'number') {
      if (event.type === 'deviceorientationabsolute') {
        raw = event.alpha
      } else {
        raw = isAndroidUserAgent()
          ? (event.alpha + 180) % 360
          : (360 - event.alpha) % 360
      }
    }

    const branch = resolveBranch(event)

    if (
      event.type === 'deviceorientationabsolute' &&
      typeof event.alpha === 'number'
    ) {
      if (!state.hasReceivedAbsolute) {
        state.smoothing = []
      }
      state.hasReceivedAbsolute = true
    }

    const used =
      branch === 'webkit' ||
      branch === 'absolute' ||
      (branch === 'relative' && !state.hasReceivedAbsolute)

    if (debug) {
      if (event.type === 'deviceorientationabsolute') {
        state.absCount += 1
      } else {
        state.relCount += 1
      }

      const alpha = typeof event.alpha === 'number' ? event.alpha : null
      const beta = typeof event.beta === 'number' ? event.beta : null
      const gamma = typeof event.gamma === 'number' ? event.gamma : null

      if (branch === 'relative' && !used) {
        state.lastIgnoredRelativeAlpha = alpha
      }

      if (used) {
        state.alphaRaw = alpha
        state.beta = beta
        state.gamma = gamma
        state.screenAngle = 0
        state.eventAbsolute =
          typeof event.absolute === 'boolean' ? event.absolute : null
        state.rawHeading = raw
        state.branch = branch
      }

      const now = state.now
      const eventType = event.type ?? 'unknown'
      const lastAt = state.lastSampleAtByType[eventType]
      if (lastAt == null || now - lastAt >= DEBUG_SAMPLE_MIN_INTERVAL_MS) {
        state.lastSampleAtByType[eventType] = now
        state.samples.push({
          t: now,
          type: eventType,
          alpha,
          beta,
          gamma,
          rawHeading: raw,
          heading: state.headingRef,
          branch,
          used,
        })
        if (state.samples.length > DEBUG_SAMPLE_LIMIT) {
          state.samples.shift()
        }
      }
    }

    if (!used) {
      return
    }

    if (raw == null) {
      return
    }
    const values = state.smoothing
    values.push(raw)
    if (values.length > 5) {
      values.shift()
    }
    const average =
      values.reduce((sum, value) => sum + value, 0) / values.length
    const previous = state.heading
    let next
    if (previous != null && Math.abs(average - previous) < 2) {
      next = previous
    } else {
      next = average
    }
    state.heading = next
    state.headingRef = next
  }

  function fire(event, dt = DEBUG_SAMPLE_MIN_INTERVAL_MS) {
    state.now += dt
    handle(event)
  }

  return { state, fire }
}

function snapshot(state) {
  return {
    heading: state.heading,
    alphaRaw: state.alphaRaw,
    beta: state.beta,
    gamma: state.gamma,
    branch: state.branch,
    absCount: state.absCount,
    relCount: state.relCount,
    rawHeading: state.rawHeading,
    lastIgnoredRelativeAlpha: state.lastIgnoredRelativeAlpha,
    sampleCount: state.samples.length,
    usedFlags: state.samples.map((s) => s.used),
    sampleAlphas: state.samples.map((s) => s.alpha),
    sampleBranches: state.samples.map((s) => s.branch),
  }
}

function hasNaN(value) {
  if (typeof value === 'number') {
    return Number.isNaN(value)
  }
  if (Array.isArray(value)) {
    return value.some(hasNaN)
  }
  if (value && typeof value === 'object') {
    return Object.values(value).some(hasNaN)
  }
  return false
}

function assert(name, condition, detail) {
  return {
    name,
    pass: Boolean(condition),
    detail: detail ?? null,
  }
}

function runCapacityTest() {
  const engine = createEngine({ debug: true, android: true })
  const headingLog = []

  for (let i = 0; i < 10; i += 1) {
    engine.fire({
      type: 'deviceorientation',
      alpha: i * 10,
      beta: 0,
      gamma: 0,
      absolute: false,
    })
    headingLog.push({ phase: 'pre-lock-relative', heading: engine.state.heading })
  }

  engine.fire({
    type: 'deviceorientationabsolute',
    alpha: 280.6,
    beta: 0,
    gamma: 0,
    absolute: true,
  })
  const headingAfterLock = engine.state.heading
  headingLog.push({ phase: 'lock-absolute', heading: headingAfterLock })

  for (let i = 0; i < 200; i += 1) {
    engine.fire({
      type: 'deviceorientation',
      alpha: 1,
      beta: 0,
      gamma: 0,
      absolute: false,
    })
    headingLog.push({
      phase: 'post-lock-relative',
      heading: engine.state.heading,
    })
  }

  const snap = snapshot(engine.state)
  const postLockHeadings = headingLog
    .filter((row) => row.phase === 'post-lock-relative')
    .map((row) => row.heading)
  const headingUnchanged = postLockHeadings.every((h) => h === headingAfterLock)
  const nanFound =
    hasNaN(snap) ||
    engine.state.samples.some((s) =>
      hasNaN([s.t, s.alpha, s.beta, s.gamma, s.rawHeading, s.heading]),
    )

  const checks = [
    assert('relCount > 10 after lock', snap.relCount > 10, snap.relCount),
    assert('samples <= 150', snap.sampleCount <= 150, snap.sampleCount),
    assert(
      'samples exactly 150 after overflow',
      snap.sampleCount === 150,
      snap.sampleCount,
    ),
    assert(
      'heading unchanged by post-lock relative',
      headingUnchanged,
      { headingAfterLock, last: postLockHeadings.at(-1) },
    ),
    assert('no NaN', !nanFound, nanFound),
    assert(
      'post-lock relative samples used=false',
      engine.state.samples
        .filter((s) => s.branch === 'relative' && s.t > headingLog[10].t)
        .every((s) => s.used === false),
      engine.state.samples.filter((s) => s.branch === 'relative').slice(-3),
    ),
  ]

  return {
    name: 'capacity-and-lock',
    description:
      '10 relative → 1 absolute (alpha=280.6) → 200 relative after lock',
    snapshot: {
      heading: snap.heading,
      alphaRaw: snap.alphaRaw,
      rawHeading: snap.rawHeading,
      branch: snap.branch,
      absCount: snap.absCount,
      relCount: snap.relCount,
      lastIgnoredRelativeAlpha: snap.lastIgnoredRelativeAlpha,
      sampleCount: snap.sampleCount,
    },
    headingAfterLock,
    checks,
    pass: checks.every((c) => c.pass),
  }
}

function runPollutionCounterTest() {
  const engine = createEngine({ debug: true, android: true })

  engine.fire({
    type: 'deviceorientationabsolute',
    alpha: 280.6,
    beta: 1.2,
    gamma: -0.4,
    absolute: true,
  })
  const afterAbsolute = {
    alphaRaw: engine.state.alphaRaw,
    rawHeading: engine.state.rawHeading,
    heading: engine.state.heading,
    lastIgnoredRelativeAlpha: engine.state.lastIgnoredRelativeAlpha,
    branch: engine.state.branch,
  }

  engine.fire({
    type: 'deviceorientation',
    alpha: 280.4,
    beta: 9.9,
    gamma: 9.9,
    absolute: false,
  })
  const afterRelative = {
    alphaRaw: engine.state.alphaRaw,
    rawHeading: engine.state.rawHeading,
    heading: engine.state.heading,
    lastIgnoredRelativeAlpha: engine.state.lastIgnoredRelativeAlpha,
    branch: engine.state.branch,
    beta: engine.state.beta,
    gamma: engine.state.gamma,
  }

  const checks = [
    assert(
      'آخر relative (متجاهَل) = 280.4',
      afterRelative.lastIgnoredRelativeAlpha === 280.4,
      afterRelative.lastIgnoredRelativeAlpha,
    ),
    assert(
      'heading قبل التنعيم = 280.6',
      afterRelative.rawHeading === 280.6,
      afterRelative.rawHeading,
    ),
    assert(
      'alphaRaw stays 280.6 (no pollution)',
      afterRelative.alphaRaw === 280.6,
      afterRelative.alphaRaw,
    ),
    assert(
      'beta/gamma not overwritten by ignored relative',
      afterRelative.beta === 1.2 && afterRelative.gamma === -0.4,
      { beta: afterRelative.beta, gamma: afterRelative.gamma },
    ),
    assert(
      'branch stays absolute',
      afterRelative.branch === 'absolute',
      afterRelative.branch,
    ),
    assert(
      'heading (smoothed) stays 280.6',
      afterRelative.heading === 280.6,
      afterRelative.heading,
    ),
    assert('no NaN', !hasNaN(afterRelative), afterRelative),
  ]

  return {
    name: 'pollution-counter',
    description:
      'absolute alpha=280.6 then relative alpha=280.4; summary must stay on used event',
    afterAbsolute,
    afterRelative,
    checks,
    pass: checks.every((c) => c.pass),
  }
}

const results = {
  commit: '177db019d6372bdc3d6a6c32e69550cdc0fb9ba2',
  base: '908edb2078764cbca732dc3f042a72bf184141c4',
  runAt: new Date().toISOString(),
  tests: [runCapacityTest(), runPollutionCounterTest()],
}

results.pass = results.tests.every((t) => t.pass)

console.log('BC-014c synthetic tests @ 177db01')
console.log(JSON.stringify(results, null, 2))
console.log(results.pass ? 'ALL PASS' : 'FAIL')

if (!results.pass) {
  process.exit(1)
}
