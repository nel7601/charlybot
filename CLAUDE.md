# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A SvelteKit application for controlling a robotic bartender via Modbus TCP. The robot is typically controlled through ABB RobotStudio's Modbus TCP server. The app provides a web interface to order predefined cocktails or create custom drinks, with real-time progress monitoring via Modbus polling. Built with Svelte 5, Vite, pnpm, DaisyUI, and Tailwind CSS 4.

## Commands

### Development
- `pnpm dev` - Start development server
- `pnpm dev -- --open` - Start development server and open in browser
- `pnpm prepare` - Sync SvelteKit generated files

### Building
- `pnpm build` - Create production build
- `pnpm preview` - Preview production build locally

### Type Checking
- `pnpm check` - Run svelte-check for type checking
- `pnpm check:watch` - Run svelte-check in watch mode

### Development Tools
- `pnpm modbus:test` - Test Modbus connectivity and support
- `pnpm modbus:simulator` - Start the Modbus development simulator (runs on port 5502)
  - Use when RobotStudio is unavailable - simulates robot behavior locally
  - Configure with: `MODBUS_HOST=127.0.0.1` and `MODBUS_PORT=5502`

### Mock Mode (Development & Testing)
- `MOCK_MODBUS=true` environment variable enables mock Modbus mode
  - No hardware or simulator required
  - Simulates robot behavior in code
  - Instant for testing and development
  - Auto-progresses through drink preparation (3 seconds)

**Mock Control API:**
- `GET /api/mock/control` - Get current mock robot state
- `POST /api/mock/control` - Control mock behavior
  ```json
  // Set a specific coil
  { "action": "setState", "address": 91, "value": true }

  // Reset to default state
  { "action": "reset" }

  // Enable random errors (5% failure rate)
  { "action": "setErrorSimulation", "enabled": true }

  // Simulate connection error
  { "action": "simulateError" }
  ```

**Example Development Scenarios:**
```bash
# Start dev server with mock mode
MOCK_MODBUS=true pnpm dev

# Test robot busy state
curl -X POST http://localhost:5173/api/mock/control \
  -H "Content-Type: application/json" \
  -d '{"action":"setState","address":92,"value":false}'

# Reset mock after testing
curl -X POST http://localhost:5173/api/mock/control \
  -H "Content-Type: application/json" \
  -d '{"action":"reset"}'
```

## Architecture

### Modbus Communication

The app communicates with a robotic bartender via Modbus TCP. Key architectural concepts:

**Modbus Addresses (Coils):**
- **Step states (32-41):** Read-only indicators for each preparation step (mint, muddling, ice, syrup, lime, whiteRum, darkRum, whiskey, soda, coke)
- **Cocktail selection (100-107):** Predefined cocktail triggers
- **Start signal (96):** Write `true` to begin robot execution
- **Ingredient writes (132-143):** For custom cocktails, write selected ingredients
- **System states (90-92):** cupHolder, drinkReady, waitingRecipe
  - `waitingRecipe` (92): `true` = robot ready, `false` = robot busy
  - `drinkReady` (91): `true` = drink complete, triggers reset sequence

**Order Flow:**
1. Frontend calls `POST /api/cocktails/[id]` with cocktail ID
2. Server writes ingredient addresses to Modbus, then writes cocktail address and start signal (96)
3. Frontend polls `GET /api/status` every 3 seconds to monitor robot state
4. When `drinkReady` (91) = `true`, frontend calls `POST /api/reset-addresses` to reset all addresses
5. When `waitingRecipe` (92) = `true` again, robot is ready for next order

**Custom Cocktails:**
- Custom drinks use cocktail ID 107 (address 107)
- Ingredients are written to addresses 132-141 based on selection
- Steps are dynamically generated and sorted by Modbus address for correct execution order

### Configuration

**Modbus Config:**
- Server-side: `src/lib/server/modbusConfig.js` - reads from `modbus-config.json` or env vars
- Client-side: `src/lib/stores/modbusConfig.js` - persists to localStorage
- Environment variables: `MODBUS_HOST`, `MODBUS_PORT`, `MODBUS_UNIT_ID`, `MODBUS_TIMEOUT`

**Modbus Registry (Single Source of Truth):**
- `src/lib/modbus/registry.js` - Centralized Modbus configuration
- Contains all address definitions, ingredients, cocktails, and system states
- Utility functions for address calculations and robot state management
- All other files import from here - do not hardcode addresses elsewhere
  - `ADDRESS_RANGES` - Address range constants
  - `INGREDIENTS` - All ingredients with read/write addresses
  - `SYSTEM_STATES` - System state definitions
  - `COCKTAILS` - Predefined cocktail recipes
  - `getIngredient(id)`, `getCocktail(id)` - Lookup functions
  - `getCocktailWriteAddresses(id)` - Get write addresses for cocktail
  - `getCustomWriteAddresses(ingredients)` - Get addresses for custom drinks
  - `createDefaultRobotState()` - Create default state object
  - `getResetAddresses()` - Get all addresses to reset
  - `getCocktailSteps(id, customIngredients)` - Generate steps for UI
  - `getBatchReadConfig()` - Get read configuration
- Server-side: `src/lib/server/modbusConfig.js` - reads from `modbus-config.json` or env vars
- Client-side: `src/lib/stores/modbusConfig.js` - persists to localStorage
- Environment variables: `MODBUS_HOST`, `MODBUS_PORT`, `MODBUS_UNIT_ID`, `MODBUS_TIMEOUT`

**Voice Recognition:**
- Uses OpenAI Whisper for transcription and GPT-4.1-mini for intent parsing
- Supports Spanish and English drink orders
- Can identify predefined cocktails or extract custom ingredients
- Requires `OPENAI_API_KEY` environment variable

### Project Structure

- `src/routes/` - SvelteKit file-based routing
  - `+page.svelte` - Page components
  - `+layout.svelte` - Layout components
- `src/lib/` - Reusable components and utilities (aliased as `$lib`)
- `src/app.html` - HTML template shell
- `src/app.d.ts` - TypeScript ambient declarations for SvelteKit types
- `static/` - Static assets served from root

## Technology Stack

- **Framework**: SvelteKit 2.x with Svelte 5.x (uses runes: `$props()`, `$state()`, etc.)
- **Build Tool**: Vite 7.x
- **Language**: JavaScript with JSDoc type checking enabled
- **Package Manager**: pnpm (note: uses `onlyBuiltDependencies` for esbuild)

## Important Notes

- This project uses **Svelte 5** which has a different API than Svelte 4:
  - Use runes (`$props()`, `$state()`, `$derived()`, `$effect()`) instead of `export let`
  - Use `{@render children()}` instead of `<slot>`
- JavaScript is used with JSDoc, not TypeScript (jsconfig.json with checkJs enabled)
- The adapter is `@sveltejs/adapter-node` (outputs to `build/` directory)
- All Modbus variables are COILS in RobotStudio, not holding registers
- Modbus writes are spaced with 50ms delays to prevent saturating the server
- Status polling runs at 3-second intervals to avoid conflicts with write operations
