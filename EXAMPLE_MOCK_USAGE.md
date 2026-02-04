# Mock Mode Usage Examples

## Quick Start

### 1. Start Development Server with Mock Mode

```bash
# Linux/Mac
MOCK_MODBUS=true pnpm dev

# Windows CMD
set MOCK_MODBUS=true && pnpm dev

# Windows PowerShell
$env:MOCK_MODBUS="true"; pnpm dev
```

### 2. Test Basic Flow (No Hardware Required)

```javascript
// Order a mojito - the mock will simulate robot behavior
fetch('/api/cocktails/mojito', { method: 'POST' })
  .then(r => r.json())
  .then(console.log);
// Output: { success: true, message: "Started preparing Mojito" }

// Check status - mock auto-progresses after 3 seconds
fetch('/api/status')
  .then(r => r.json())
  .then(data => console.log(data.robotState));
// Initially: { waitingRecipe: false, drinkReady: false, ... }
// After 3s: { waitingRecipe: false, drinkReady: true, ... }
```

## API Control Examples

### Check Mock State
```bash
curl http://localhost:5173/api/mock/control
```

Response:
```json
{
  "enabled": true,
  "state": {
    "mint": false,
    "ice": false,
    "whiteRum": false,
    "waitingRecipe": true,
    "drinkReady": false
  }
}
```

### Simulate Robot Busy
```bash
curl -X POST http://localhost:5173/api/mock/control \
  -H "Content-Type: application/json" \
  -d '{"action":"setState","address":92,"value":false}'
```

This will cause orders to fail with "Robot is busy" error.

### Trigger Drink Complete
```bash
curl -X POST http://localhost:5173/api/mock/control \
  -H "Content-Type: application/json" \
  -d '{"action":"setState","address":91,"value":true}'
```

This will trigger the reset sequence and close the progress modal.

### Test Custom Drink with Specific Ingredients
```bash
# Order custom drink with mint, ice, and soda
curl -X POST http://localhost:5173/api/cocktails/custom \
  -H "Content-Type: application/json" \
  -d '{"ingredients":["mint","ice","soda"]}'

# Check that auto-triggered ingredients were added
curl http://localhost:5173/api/mock/control
```

The mock automatically adds `muddling` (because of `mint`) and `stirring`/`straw` (because of `soda`).

## Testing Scenarios

### Scenario 1: Test Error Handling
```bash
# Enable error simulation (5% random failures)
curl -X POST http://localhost:5173/api/mock/control \
  -H "Content-Type: application/json" \
  -d '{"action":"setErrorSimulation","enabled":true}'

# Try ordering multiple times to see error handling
for i in {1..10}; do
  curl -X POST http://localhost:5173/api/cocktails/mojito \
    -H "Content-Type: application/json"
  echo ""
done
```

### Scenario 2: Test Reset Flow
```bash
# 1. Start a drink
curl -X POST http://localhost:5173/api/cocktails/mojito \
  -H "Content-Type: application/json"

# 2. Wait, then manually trigger drink complete
sleep 2
curl -X POST http://localhost:5173/api/mock/control \
  -H "Content-Type: application/json" \
  -d '{"action":"setState","address":91,"value":true}'

# 3. Verify reset happened
sleep 1
curl http://localhost:5173/api/mock/control
# All ingredient addresses should be false (reset)
```

### Scenario 3: Test Connection Error Recovery
```bash
# Simulate connection error
curl -X POST http://localhost:5173/api/mock/control \
  -H "Content-Type: application/json" \
  -d '{"action":"simulateError"}'

# Try ordering - should fail gracefully
curl -X POST http://localhost:5173/api/cocktails/mojito \
  -H "Content-Type: application/json"

# Reset mock
curl -X POST http://localhost:5173/api/mock/control \
  -H "Content-Type: application/json" \
  -d '{"action":"reset"}'

# Try again - should work
curl -X POST http://localhost:5173/api/cocktails/mojito \
  -H "Content-Type: application/json"
```

## Browser Console Testing

```javascript
// Open browser console while app is running with MOCK_MODBUS=true

// Check current robot state
fetch('/api/mock/control').then(r => r.json()).then(console.log);

// Order a predefined cocktail
fetch('/api/cocktails/whiskey-highball', { method: 'POST' })
  .then(r => r.json())
  .then(console.log);

// Order a custom cocktail
fetch('/api/cocktails/custom', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ingredients: ['whiskey', 'ice']
  })
}).then(r => r.json()).then(console.log);

// Manually progress the mock (skip 3-second wait)
fetch('/api/mock/control', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'setState',
    address: 91,
    value: true
  })
});

// Reset mock state
fetch('/api/mock/control', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'reset' })
});
```

## Integration Testing Example

```javascript
// test-mock-flow.js
async function testCompleteOrderFlow() {
  console.log('Testing complete order flow with mock...');

  // 1. Check initial state
  let state = await fetch('/api/mock/control').then(r => r.json());
  console.log('Initial state:', state.state);

  // 2. Order a cocktail
  let order = await fetch('/api/cocktails/mojito', { method: 'POST' })
    .then(r => r.json());
  console.log('Order response:', order);

  // 3. Poll status until complete
  while (true) {
    await new Promise(r => setTimeout(r, 500));
    let status = await fetch('/api/status').then(r => r.json());
    console.log('Drink ready:', status.robotState.drinkReady);
    if (status.robotState.drinkReady) break;
  }

  // 4. Verify reset happened
  await new Promise(r => setTimeout(r, 1000));
  state = await fetch('/api/mock/control').then(r => r.json());
  console.log('Final state:', state.state);

  // 5. Reset mock for next test
  await fetch('/api/mock/control', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'reset' })
  });

  console.log('✓ Test complete!');
}

// Run in browser console or with node-fetch
testCompleteOrderFlow();
```

## Benefits

- **No Hardware Required**: Develop without robot or simulator
- **Instant Feedback**: Mock responds in ~10ms vs real connection delays
- **Deterministic Tests**: Same inputs always produce same outputs
- **Scenario Testing**: Test edge cases easily (busy, errors, timeouts)
- **CI/CD Ready**: Run tests in pipelines without hardware dependencies
