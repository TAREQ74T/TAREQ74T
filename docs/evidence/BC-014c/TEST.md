# BC-014c synthetic tests @ 177db01

Base: 908edb2
Subject: 177db019d6372bdc3d6a6c32e69550cdc0fb9ba2
Engine: docs/evidence/BC-014c/synthetic-test.mjs
Mirrors: src/hooks/useDeviceOrientation.ts handler (no React)

## A) capacity-and-lock

Sequence:
- 10 relative events (alpha = 0,10,...,90)
- 1 absolute event (alpha = 280.6)
- 200 relative events after lock (alpha = 1)

Expected:
- relCount > 10 after lock
- samples <= 150 (exactly 150 after overflow)
- heading unchanged by post-lock relative
- no NaN
- post-lock relative samples used=false

## B) pollution-counter

Sequence:
- absolute alpha=280.6, beta=1.2, gamma=-0.4
- relative alpha=280.4, beta=9.9, gamma=9.9

Expected:
- lastIgnoredRelativeAlpha = 280.4
- rawHeading (heading قبل التنعيم) = 280.6
- alphaRaw stays 280.6
- beta/gamma stay 1.2 / -0.4
- branch stays absolute
- heading stays 280.6
- no NaN

## Files

- synthetic-test.mjs — test engine
- stdout.txt — full stdout
- results.json — parsed JSON
- capacity-and-lock.json — test A
- pollution-counter.json — test B
- diff-908edb2-177db01.diff — full increment diff
