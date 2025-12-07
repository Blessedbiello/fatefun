# FATE Protocol - Game Arena Layout

## Visual Layout Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FATE Arena (1920×1080)                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│    ┌────────────┐        ┌──────────────────┐        ┌──────────┐  │
│    │ Match Info │        │   Price Chart    │        │  Score   │  │
│    │  20, 20    │        │   (600×300)      │        │  board   │  │
│    │  300×120   │        │    960, 150      │        │ 1600,20  │  │
│    └────────────┘        └──────────────────┘        │ 300×400  │  │
│                                                       │          │  │
│                                                       │ ┌──────┐ │  │
│         Player 1                                      │ │ 📈 5 │ │  │
│            ●                                          │ │ 📉 3 │ │  │
│                                                       │ └──────┘ │  │
│                                                       │          │  │
│    Player 2        ╔═══════════════╗      Player 3   │  Alice   │  │
│        ●           ║               ║          ●       │  📈      │  │
│                    ║  PRICE ORB    ║                  │          │  │
│                    ║               ║                  │  Bob     │  │
│                    ║  $100.50      ║                  │  📉      │  │
│                    ║  +2.3%        ║                  └──────────┘  │
│                    ║               ║                                │
│    Player 4        ║   960, 540    ║      Player 5                  │
│        ●           ║   Size: 120   ║          ●                     │
│                    ║               ║                                │
│                    ╚═══════════════╝                                │
│                                                                      │
│         Player 6                                                     │
│            ●                                                         │
│                                                                      │
│  ┌─────────┐                                          ┌────────┐   │
│  │  Chat   │       ┌───────────────────┐             │ Timer  │   │
│  │  20,700 │       │                   │             │960,720 │   │
│  │ 350×360 │       │      5:00         │             │ 72px   │   │
│  │         │       │  Time Remaining   │             └────────┘   │
│  │ Alice:  │       └───────────────────┘                           │
│  │ Let's   │                                                        │
│  │ go! 🚀  │       ┌─────────┐  ┌─────────┐                       │
│  │         │       │         │  │         │                        │
│  │ System: │       │ HIGHER  │  │  LOWER  │                        │
│  │ Bob     │       │   📈    │  │   📉    │                        │
│  │ joined  │       │         │  │         │                        │
│  └─────────┘       │ 660,850 │  │ 940,850 │                        │
│                    │ 250×100 │  │ 250×100 │                        │
│                    └─────────┘  └─────────┘                        │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## Coordinate System

Origin: Top-left (0, 0)
Canvas: 1920 × 1080 pixels

### Key Positions

| Element | X | Y | Width | Height | Notes |
|---------|---|---|-------|--------|-------|
| **Price Orb** | 960 | 540 | 120 | 120 | Center of screen, pulsing |
| **Price Chart** | 960 | 150 | 600 | 300 | Top center, real-time graph |
| **Prediction Buttons** | 660 | 850 | 530 | 100 | Bottom center (HIGHER + LOWER + gap) |
| **Timer** | 960 | 720 | - | 72px | Large countdown above buttons |
| **Match Info** | 20 | 20 | 300 | 120 | Top-left panel |
| **Scoreboard** | 1600 | 20 | 300 | 400 | Top-right panel |
| **Chat** | 20 | 700 | 350 | 360 | Bottom-left sidebar |

### Player Circle

- **Center:** (960, 540) - matches price orb
- **Radius:** 350 pixels
- **Positioning:** Evenly distributed around circle
- **Formula:**
  ```javascript
  angle = (2π × playerIndex) / totalPlayers - π/2
  x = 960 + cos(angle) × 350
  y = 540 + sin(angle) × 350
  ```

**Example with 6 players:**
- Player 0: 960, 190 (top)
- Player 1: 1263, 365 (top-right)
- Player 2: 1263, 715 (bottom-right)
- Player 3: 960, 890 (bottom)
- Player 4: 657, 715 (bottom-left)
- Player 5: 657, 365 (top-left)

## Visual Effects Layers

Rendering order (bottom to top):

```
1. Background (#0a0a0a solid)
   ↓
2. Price Chart (top)
   ↓
3. Particle Effects (behind players)
   - Confetti
   - Sparkles
   - Explosions
   - Trails
   ↓
4. Prediction Orbs (player predictions)
   ↓
5. Price Orb (center focal point)
   ↓
6. Players (with glow effects)
   - Avatar circle
   - Glow aura (if predicted)
   - Username text
   - Level badge
   - Prediction icon
   - Emote (if active)
   - Chat bubble (if active)
   ↓
7. UI Components
   - Prediction Buttons
   - Timer
   - Scoreboard
   - Chat
   ↓
8. Debug Info (if enabled)
```

## Particle Effect Zones

### Confetti (Winners)
- **Origin:** Player position (x, y)
- **Count:** 80 particles per winner
- **Spread:** 360° radial explosion
- **Speed:** 200-500 px/s
- **Lifetime:** 2-3 seconds
- **Gravity:** 600 px/s²
- **Colors:** Purple, Pink, Yellow, Green, Blue, Red

### Sparkles (Predictions)
- **Origin:** Player position (x, y)
- **Count:** 15-20 particles
- **Spread:** 360° radial
- **Speed:** 50-150 px/s
- **Lifetime:** 500-1000ms
- **Color:** Matches prediction (green/red)
- **Shape:** Stars

### Price Explosions (Volatility)
- **Origin:** Price orb center (960, 540)
- **Count:** 20 particles
- **Trigger:** > 2% price change
- **Speed:** 150-350 px/s
- **Lifetime:** 1-1.5 seconds
- **Color:** Green (up) / Red (down)
- **Shape:** Circles

### Movement Trails
- **Origin:** Player position during movement
- **Probability:** 30% per frame when moving
- **Count:** 1 particle per trigger
- **Lifetime:** 300ms
- **Color:** Player color
- **Shape:** Circle
- **Size:** 12px

## Camera System

### Default View
- **Target:** (960, 540) - price orb center
- **Smoothing:** 10% per frame interpolation
- **Bounds:** None (static arena)

### Shake Effect (Timer Urgency)
- **Trigger:** Timer < 10 seconds
- **Intensity:** (10 - remainingSeconds) × 2
- **Range:** ±2 to ±20 pixels
- **Offset:** Applied to camera target
- **Random:** Each frame, X and Y independently

## Glow Effects

### Player Glow (When Predicted)
- **Size:** Player radius × 1.5
- **Color:** Green (#10b981) for HIGHER, Red (#ef4444) for LOWER
- **Intensity:** 0.5 + sin(phase) × 0.3 (oscillating 20-80%)
- **Frequency:** 3 Hz pulse
- **Shadow Blur:** 30px × intensity

### Price Orb Glow (Volatility)
- **Inner glow:** Always present (white → color gradient)
- **Outer glow:** Only during price changes
- **Size:** Orb size × (1 + intensity × 0.5)
- **Intensity:** Proportional to % change (capped at 1.0)
- **Decay:** 1.5x per second

### Prediction Button Glow
- **Trigger:** Enabled state only
- **Intensity:** 0.3 + sin(phase) × 0.2 (oscillating 30-50%)
- **Frequency:** 2 Hz pulse
- **Shadow Color:** Button color (green/red)
- **Shadow Blur:** 20px × scale

## Animation Timings

| Effect | Duration | Easing |
|--------|----------|--------|
| **Button hover** | Continuous | 10x smoothing |
| **Button pulse** | 500ms cycle | Sine wave |
| **Timer pulse** | 500ms cycle (speeds up) | Sine wave |
| **Screen shake** | Per-frame random | None |
| **Player glow** | 333ms cycle | Sine wave |
| **Price orb pulse** | 500ms cycle | Sine wave |
| **Confetti** | 2-3s lifetime | Gravity physics |
| **Sparkles** | 0.5-1s lifetime | Linear fade |
| **Explosions** | 1-1.5s lifetime | Gravity + fade |
| **Trails** | 300ms | Linear fade |
| **Particle fade** | Last 30% of lifetime | Linear |
| **Camera smooth** | 10% per frame | Exponential |

## Color Coding

### Predictions
- **HIGHER:** #10b981 (Green)
- **LOWER:** #ef4444 (Red)

### Price States
- **Above Start:** #10b981 (Green)
- **Below Start:** #ef4444 (Red)
- **At Start:** #a855f7 (Purple)

### Timer Urgency
- **> 10s:** #ffffff (White)
- **5-10s:** #f59e0b (Yellow)
- **< 5s:** #ef4444 (Red)

### UI Elements
- **Primary:** #a855f7 (Purple)
- **Secondary:** #ec4899 (Pink)
- **Background:** #0a0a0a (Black)
- **Panel BG:** rgba(17, 24, 39, 0.9) (Dark gray, 90% opacity)
- **Border:** #374151 (Medium gray)
- **Text Primary:** #ffffff (White)
- **Text Secondary:** #9ca3af (Light gray)
- **Text Disabled:** #6b7280 (Gray)

## Responsive Considerations

**Desktop (1920×1080):**
- Native resolution
- Full UI layout as designed
- All effects enabled

**Laptop (1366×768):**
- Scale canvas to fit
- Maintain 16:9 aspect ratio
- May letterbox vertically

**Tablet/Mobile:**
- Not primary target (desktop game)
- Would need touch controls redesign
- Simplified particle effects
- Larger touch targets

## Performance Targets

- **FPS:** 60 (stable)
- **Frame time:** < 16.67ms
- **Particle count:** < 500 simultaneous
- **Network updates:** 20 Hz (50ms intervals)
- **Price updates:** Blockchain rate (~400ms Pyth)
- **Memory:** < 100MB canvas + game state

## Accessibility

**Visual:**
- High contrast colors (green/red for predictions)
- Large text (72px timer, 24px buttons)
- Clear icons (📈/📉)

**Interaction:**
- Keyboard controls (WASD)
- Large click targets (250×100px buttons)
- Visual feedback on all interactions

**Cognitive:**
- Simple binary choice (HIGHER/LOWER)
- Clear countdown timer
- Visual progress (scoreboard)
- System messages in chat
