import type { PICTOGRAMMES } from '@/ui/composants/commun/Pictogramme'

const SECTEUR_X01 = 'M8.58 2.6 A10 10 0 0 1 15.42 2.6 L13.71 7.3 A5 5 0 0 0 10.29 7.3 Z'
const SECTEUR_ENTRAINEMENT =
  'M21.51 8.91 A10 10 0 0 1 21.51 15.09 L18.66 14.16 A7 7 0 0 0 18.66 9.84 Z'
const SECTEUR_SORTIE = 'M7.93 2.86 A10 10 0 0 1 16.07 2.86 L14.85 5.61 A7 7 0 0 0 9.15 5.61 Z'

export const TRACES_ATTENDUS: Record<(typeof PICTOGRAMMES)[number], string> = {
  x01:
    '<circle cx="12" cy="12" r="10"></circle>' +
    '<circle cx="12" cy="12" r="5"></circle>' +
    `<path d="${SECTEUR_X01}" fill="currentColor" stroke="none" fill-opacity="0.9"></path>` +
    '<circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"></circle>',
  cricket:
    '<circle cx="12" cy="12" r="9.5"></circle>' +
    '<path d="M7.5 7.5 L16.5 16.5 M16.5 7.5 L7.5 16.5"></path>',
  killer:
    '<circle cx="12" cy="12" r="7.5"></circle>' +
    '<path d="M12 1.5 V6 M12 18 V22.5 M1.5 12 H6 M18 12 H22.5"></path>' +
    '<circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none"></circle>',
  'tour-du-monde':
    '<path d="M16.25 4.64 A8.5 8.5 0 1 1 6.54 5.49"></path>' +
    '<path d="M4.61 3.19 L9.29 3.17 L8.46 7.79 Z" fill="currentColor" stroke="none"></path>' +
    '<circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none"></circle>',
  entrainement:
    '<circle cx="12" cy="12" r="10"></circle>' +
    '<circle cx="12" cy="12" r="7"></circle>' +
    `<path d="${SECTEUR_ENTRAINEMENT}" fill="currentColor" stroke="none"></path>` +
    '<path d="M12 9.5 V14.5 M9.5 12 H14.5" stroke-width="1.6"></path>',
  '180':
    '<path d="M5 21.5 V10 M2.4 3.5 L5 8 L7.6 3.5 ' +
    'M12 21.5 V10 M9.4 3.5 L12 8 L14.6 3.5 ' +
    'M19 21.5 V10 M16.4 3.5 L19 8 L21.6 3.5"></path>',
  bust:
    '<circle cx="12" cy="12" r="9.5"></circle>' +
    '<path d="M9 2.5 L13.5 9.5 L10 13 L15 21.5"></path>',
  sortie:
    '<circle cx="12" cy="12" r="10"></circle>' +
    `<path d="${SECTEUR_SORTIE}" fill="currentColor" stroke="none"></path>` +
    '<path d="M7.5 13.5 L11 17 L16.5 11"></path>',
  victoire: '<path d="M3 18 V7 L8 12 L12 4.5 L16 12 L21 7 V18 Z M3 21.5 H21"></path>',
  moyenne: '<path d="M4 20 L15 9 M15 9 L20 4 M17 4 H20 V7"></path>',
  'grosses-volees': '<path d="M5 4 V20 M9 4 V20 M13 4 V20 M17 4 V20 M2.5 17 L20.5 7"></path>',
  'meilleure-manche':
    '<circle cx="12" cy="13.5" r="8"></circle>' +
    '<path d="M12 2.5 V4.5 M9.5 2.5 H14.5 M12 13.5 V9"></path>',
  nul: '<path d="M4 9 H20 M4 15 H20"></path>',
  evolution:
    '<path d="M2.4 19.2 L8.4 12 L13.2 15.6 L21.6 4.8" stroke-width="3" stroke-linecap="butt"></path>',
}
