import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { oublierSonde } from './ui/gestes'

/*
 * Ce que jsdom (29.x) n'implémente pas, et dont l'UI a besoin. Posé
 * **seulement s'il manque** : le jour où jsdom les fournit, ce sont les siens
 * qui servent.
 *
 * - `<dialog>` : `HTMLDialogElement-impl` est vide. Sa feuille UA masque
 *   `dialog:not([open])`, donc poser / retirer `open` suffit à rendre la boîte
 *   visible ou non pour les requêtes par rôle. `close()` émet `close`, comme
 *   le navigateur — c'est ce qui resynchronise l'état React.
 * - Capture de pointeur : absente. Les faux (sans effet) laissent
 *   `ListeOrdonnable` appeler `setPointerCapture`, ce qui permet de rejouer le
 *   geste de glisser sur une mise en page simulée. La vraie mesure, les vrais
 *   Pointer Events et le rendu restent à vérifier sur appareil réel.
 */
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
  // La sonde d'historique ne survit pas au test qui l'a montée.
  oublierSonde()
})
