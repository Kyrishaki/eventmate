const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const stores = {};
function create() { return (init) => {
  let state;
  const set = (patch) => { state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) }; };
  state = init(set, () => state);
  return { getState: () => state, setState: set };
}; }
function load(path) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, require: (id) => {
    if (id === 'zustand') return { create };
    if (id === 'zustand/middleware') return { persist: (init) => init, createJSONStorage: () => ({}) };
    if (id === 'react') return {};
    if (id.includes('test-data-filter')) return { isTestAllocation: () => false };
    throw new Error(`Unexpected import ${id}`);
  }, console, Date, Map, Set, localStorage: { getItem: () => null } });
  return exports;
}
const data = load('src/stores/data-store.ts');
const allocation = { id: 'a', workspace_id: 'w', booth_id: 'b', variant_id: 'v', allocated_quantity: 20, sold_quantity: 8 };
const order = (quantity, extra = {}) => ({ workspace_id: 'w', booth_id: 'b', items: [{ variant_id: 'v', quantity }], ...extra });
function sold(orders) {
  data.useDataStore.setState({ allocations: [{ ...allocation }] });
  data.reconcileAllocationsWithOrders(orders);
  return data.useDataStore.getState().allocations[0].sold_quantity;
}
assert.equal(sold([order(2)]), 8, 'partial history must not restock');
assert.equal(sold([order(10)]), 10, 'new sales must count');
assert.equal(sold([order(15, { workspace_id: 'other' })]), 8, 'workspace isolation');
assert.equal(sold([order(10, { order_status: 'refunded', refund_restocked: false })]), 10, 'damaged refunded goods remain sold');
assert.equal(sold([order(10, { order_status: 'cancelled' })]), 8);
assert.equal(sold([order(-5), order(NaN)]), 8);
const auth = load('src/stores/auth-store.ts').useAuthStore;
const account = auth.getState().accounts[0];
auth.setState({ accounts: [{ ...account, password: 'ChangedPassword987!' }] });
assert.equal(auth.getState().login(account.username, account.password).success, false, 'bootstrap password revoked');
assert.equal(auth.getState().login(account.username, 'ChangedPassword987!').success, true);
console.log('PASS: partial histories, workspace isolation, refund stock, invalid quantities, revoked passwords');
