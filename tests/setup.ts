import '@testing-library/jest-dom/vitest'
// jsdom n'a pas d'IndexedDB : sans ça, les adapters Dexie ne seraient pas testables.
import 'fake-indexeddb/auto'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})
