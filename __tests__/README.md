# TaskLynk Testing Suite

## Overview
Comprehensive test suite for TaskLynk order management system covering financial calculations, status transitions, and end-to-end workflows.

## Test Structure

```
__tests__/
├── payment-calculations.test.ts    # Financial calculation tests
├── status-transitions.test.ts      # State machine validation tests
└── integration/
    └── order-workflows.test.ts     # E2E workflow tests
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests in CI environment
npm run test:ci
```

## Test Coverage

### Payment Calculations (`payment-calculations.test.ts`)
- **90%+ coverage** of financial logic
- Tests include:
  - Technical work detection (Excel, SPSS, PowerPoint, etc.)
  - Writer CPP rates (270 for technical, 200 for regular)
  - Client minimum rates (270 technical, 240 regular CPP)
  - CPP level system (5 tiers: Starter → Master)
  - Manager earnings (assign fee + submit fee)
  - Urgent order surcharges (40-60 KES)
  - Real-world financial scenarios
  - Edge cases (negative values, large numbers, decimals)

### Status Transitions (`status-transitions.test.ts`)
- **90%+ coverage** of state machine
- Tests include:
  - Valid transition paths
  - Invalid transition rejection
  - Internal revision blocking (prevents delivery)
  - Client-facing status hiding
  - Terminal state enforcement
  - Helper functions (labels, permissions, next states)
  - Complete workflow validation

### Integration Tests (`order-workflows.test.ts`)
- End-to-end workflow scenarios:
  - Happy path (pending → completed)
  - Internal QC revision (hidden from client)
  - Client revision request (visible to client)
  - Multiple internal revisions
  - Payment and settlement flow
  - Balance transitions (pending → reserved → cleared)
  - Freelancer rejection
  - Order cancellation
  - Urgent orders

## Key Test Scenarios

### Financial Accuracy Test
```typescript
Order: 5-page essay by Starter freelancer
- Client pays: 1200 KES (5 * 240)
- Freelancer earns: 750 KES (5 * 150 Starter CPP)
- Manager earns: 40 KES (10 assign + 30 submit)
- Admin profit: 410 KES (1200 - 750 - 40)
✅ Total reconciles
```

### Internal Revision Test
```typescript
Workflow:
1. Freelancer submits (editing)
2. Admin requests internal revision
3. Freelancer resubmits
4. Admin delivers to client
✅ Client never saw revision
✅ Status transitions valid
```

### Status Transition Validation Test
```typescript
editing → delivered with open internal revision
❌ BLOCKED
Error: "Cannot deliver order with open internal revision"
Reason: "All internal QC revisions must be completed"
```

## Coverage Thresholds

Minimum coverage requirements:
- `payment-calculations.ts`: 90% (statements, branches, functions, lines)
- `status-transitions.ts`: 90% (statements, branches, functions, lines)

## Test Environment

- **Framework**: Jest with TypeScript support
- **Test Runner**: ts-jest
- **Environment**: Node.js (for API tests)
- **Mocking**: Built-in Jest mocks for Next.js components
- **Assertions**: @jest/globals

## Configuration Files

- `jest.config.js` - Main Jest configuration
- `jest.setup.js` - Test environment setup and mocks
- `tsconfig.json` - TypeScript configuration (shared with main app)

## Adding New Tests

1. Create test file in `__tests__/` directory
2. Name file with `.test.ts` extension
3. Import from `@jest/globals`:
   ```typescript
   import { describe, it, expect } from '@jest/globals';
   ```
4. Use `@/` alias for imports:
   ```typescript
   import { functionName } from '@/lib/module-name';
   ```
5. Run `npm test` to verify

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Push to main branch
- Pre-deployment checks

Use `npm run test:ci` for CI environments.

## Troubleshooting

### Tests failing?
1. Check environment variables in `jest.setup.js`
2. Verify imports use `@/` alias
3. Ensure all dependencies installed: `npm install`

### Coverage not meeting threshold?
1. Run `npm run test:coverage` to see report
2. Add tests for uncovered branches
3. Focus on critical financial functions first

### TypeScript errors?
1. Verify `tsconfig.json` includes test directories
2. Check type imports from tested modules
3. Use `any` type only when necessary

## Best Practices

✅ **DO:**
- Test critical financial calculations exhaustively
- Cover both happy paths and edge cases
- Use descriptive test names
- Group related tests with `describe()`
- Test one behavior per `it()` block
- Mock external dependencies

❌ **DON'T:**
- Skip tests for financial logic
- Ignore edge cases (null, zero, negative)
- Test implementation details
- Make tests dependent on each other
- Commit commented-out tests

## Future Enhancements

- [ ] Add API endpoint integration tests
- [ ] Add database transaction tests
- [ ] Add performance/load tests
- [ ] Add visual regression tests for UI
- [ ] Add E2E tests with test database
- [ ] Add mutation testing
- [ ] Add accessibility tests
