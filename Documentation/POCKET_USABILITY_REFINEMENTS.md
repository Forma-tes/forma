
## Runtime fix: Overview account balances

The main Overview account summary reads transaction data to calculate each account balance. Added `transactions` to the Overview component props destructuring so the balance calculation uses the transaction collection passed by App rather than an undeclared binding. This addresses the new Overview render path.

## Runtime TDZ fix — 2026-10-24
- Fixed a real temporal-dead-zone issue in `src/main.jsx`: the vehicle maintenance alerts `useEffect` had `allowedFeatures.join('|')` in its dependency array before `allowedFeatures` was initialized in `App()`.
- Moved the effect below the `allowedFeatures` declaration so the dependency expression is evaluated only after initialization.
- The earlier `transactions` prop addition to `Overview` is retained.
