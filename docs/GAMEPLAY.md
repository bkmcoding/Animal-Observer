# Animal Observer Gameplay Guide

Animal Observer is an endless observation game. You are a field scientist watching animals interact, counting captures, and filing the most accurate report you can.

## How to play

1. Select **Start Animal Observer**.
2. Read the tutorial and select **Continue**.
3. Wait for the three-second countdown.
4. Watch the 50-second observation round.
5. Enter a whole number for each animal you observed.
6. Submit your report to receive your round score.
7. Select **Next round** to continue.

Rounds continue indefinitely. Your session score accumulates across every completed report.

## Round phases

| Phase | Length | What happens |
| --- | ---: | --- |
| Countdown | 3 seconds | The round number, ecosystem, and score are visible while animals are placed. |
| Observation | 50 seconds | Animals move, chase, and capture prey. The monster crosses as a visual distraction. |
| Report | No time limit | You enter counts, see the actual results, and receive your score. |

## Ecosystems

### Field rounds — odd rounds

- **Cow** chases **Wolf**.
- **Wolf** chases **Sheep**.
- **Sheep** chases **Cow**.

### Sea rounds — even rounds

- **Shark** chases **Ice cream**.
- **Ice cream** flees from **Shark**.

Only the active ecosystem’s animals appear during a round.

## Scoring

Each round is worth **300 base points**, divided evenly across the active species:

- **Field round:** 100 points per species.
- **Sea round:** 150 points per species.

For each species:

```text
error = absolute difference between your guess and the actual count
penalty = maximum of 5 and floor(category maximum ÷ 10)
points = maximum of 0 and category maximum - (penalty × error)
```

Examples:

- A field round with a **2-count error** loses **20 points** for that species.
- A sea round with a **1-count error** loses **15 points** for that species.

If every species is exact, you also receive a **+50 perfect-round bonus**.

The maximum score for any round is therefore **350**.

## Endless progression

Difficulty increases as you complete rounds:

| Round | Ecosystem | Animals per species | Speed multiplier | Monster sweeps |
| ---: | --- | ---: | ---: | ---: |
| 1 | Field | 5 | 1.00 | 1 |
| 2 | Sea | 10 | 1.08 | 1 |
| 3 | Field | 6 | 1.16 | 2 |
| 4 | Sea | 12 | 1.24 | 2 |
| 5 | Field | 7 | 1.32 | 3 |
| 6 | Sea | 14 | 1.40 | 3 |
| 7+ | Alternating | Continues increasing | Continues increasing | Stays at 3 |

Progression caps:

- Field rounds stop increasing at **10 animals per species**.
- Sea rounds stop increasing at **20 animals per species**.
- Speed stops increasing at **2.00×**.
- Monster sweeps stop increasing at **3 per round**.

## Monster behavior

The monster is a harmless visual distraction. It does not eat animals, change counts, or reduce your score. Later rounds include more sweeps to make observation more challenging.

## Session score

Scores are stored only for the current browser session. Refreshing the page starts a new session at round 1 with a score of 0.
