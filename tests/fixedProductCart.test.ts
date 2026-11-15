import assert from 'node:assert/strict';
import test from 'node:test';
import { createPinia, setActivePinia } from 'pinia';
import { useCartStore } from '../src/stores/cartStore.js';
import type { Product } from '../src/types/index.js';

test('fixed product cart merges cached selections and identifies items only by product', () => {
  const product = { id: '2', name: 'Product', price: 100, nutrition: { calories: 10, protein: 2 } } as Product;
  const cached = [
    { product, quantity: 2 },
    { product, quantity: 3 },
  ];
  const storage = new Map([
    ['nutrimate_cart_items_v2_guest', JSON.stringify(cached)],
    ['nutrimate_cart_selected_v2_guest', JSON.stringify(['2___old selection'])],
  ]);
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {} });
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) },
  });
  try {
    setActivePinia(createPinia());
    const cart = useCartStore();
    assert.equal(cart.items.length, 1);
    assert.equal(cart.items[0]?.quantity, 5);
    assert.equal(cart.selectedCount, 5);
    cart.addItem(product, 1, true);
    assert.equal(cart.items.length, 1);
    assert.equal(cart.selectedAmount, 600);
    cart.updateQuantity('2', 4);
    assert.equal(cart.selectedCount, 4);
    cart.toggleSelectItem('2');
    assert.equal(cart.selectedCount, 0);
    cart.selectAll();
    assert.equal(cart.selectedCount, 4);
    cart.removeItem('2');
    assert.equal(cart.items.length, 0);
    assert.equal(cart.selectedCount, 0);
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow);
    else Reflect.deleteProperty(globalThis, 'window');
    if (previousStorage) Object.defineProperty(globalThis, 'localStorage', previousStorage);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});
