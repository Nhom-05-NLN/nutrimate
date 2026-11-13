import assert from 'node:assert/strict';
import test from 'node:test';
import { getOptimizedCloudinaryUrl } from '../src/services/cloudinary.js';

test('getOptimizedCloudinaryUrl transforms cloudinary urls correctly', () => {
  const original = 'https://res.cloudinary.com/ffeh7ojh/image/upload/v12345/nutrimate/products/sample.jpg';
  const optimized = getOptimizedCloudinaryUrl(original, 'f_auto,q_auto,w_400');
  assert.equal(
    optimized,
    'https://res.cloudinary.com/ffeh7ojh/image/upload/f_auto,q_auto,w_400/v12345/nutrimate/products/sample.jpg'
  );
});

test('getOptimizedCloudinaryUrl preserves non-cloudinary urls', () => {
  const unsplash = 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format';
  assert.equal(getOptimizedCloudinaryUrl(unsplash), unsplash);
  assert.equal(getOptimizedCloudinaryUrl(''), '');
});
