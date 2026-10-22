import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { oublierSonde } from './ui/gestes'

// ⚠️ Polyfills jsdom posés seulement s'ils manquent : <dialog> et la capture de pointeur n'y sont pas implémentés.
if (typeof HTMLDialogElement !== 'undefined') {
  const prototype = HTMLDialogElement.prototype
  if (typeof prototype.showModal !== 'function') {
    prototype.showModal = function showModal(this: HTMLDialogElement) {
      this.setAttribute('open', '')
    }
  }
  if (typeof prototype.close !== 'function') {
    prototype.close = function close(this: HTMLDialogElement) {
      if (!this.hasAttribute('open')) return
      this.removeAttribute('open')
      this.dispatchEvent(new Event('close'))
    }
  }
}

if (typeof Element.prototype.setPointerCapture !== 'function') {
  Element.prototype.setPointerCapture = () => {}
}
if (typeof Element.prototype.releasePointerCapture !== 'function') {
  Element.prototype.releasePointerCapture = () => {}
}
if (typeof Element.prototype.hasPointerCapture !== 'function') {
  Element.prototype.hasPointerCapture = () => false
}

afterEach(() => {
  cleanup()
  oublierSonde()
})
