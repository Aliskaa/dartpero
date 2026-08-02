/**
 * Génère les icônes PWA à partir de scripts/icon.svg.
 *   npm run icons
 *
 * Sorties :
 *   public/icons/icon-192.png
 *   public/icons/icon-512.png
 *   public/icons/icon-512-maskable.png   (marge de sécurité, fond feutre)
 *   public/apple-touch-icon.png          (iOS n'aime pas la transparence)
 *   public/favicon.svg
 */
import { copyFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ici = dirname(fileURLToPath(import.meta.url))
const racine = resolve(ici, '..')
const source = resolve(ici, 'icon.svg')
const dossierIcones = resolve(racine, 'public/icons')

/** Fond « feutre » de la charte — voir CLAUDE.md. */
const FEUTRE = '#0E1A13'

const rendu = (taille) => sharp(source, { density: 512 }).resize(taille, taille)

const surFond = async (tailleInterieure, tailleFinale, destination) => {
  const interieur = await rendu(tailleInterieure).png().toBuffer()
  await sharp({
    create: {
      width: tailleFinale,
      height: tailleFinale,
      channels: 4,
      background: FEUTRE,
    },
  })
    .composite([{ input: interieur, gravity: 'centre' }])
    .png()
    .toFile(destination)
}

await mkdir(dossierIcones, { recursive: true })

for (const taille of [192, 512]) {
  await rendu(taille)
    .png()
    .toFile(resolve(dossierIcones, `icon-${taille}.png`))
}

// Maskable : ~20 % de marge, sinon Android rogne dans la cible.
await surFond(340, 512, resolve(dossierIcones, 'icon-512-maskable.png'))
await surFond(160, 180, resolve(racine, 'public/apple-touch-icon.png'))

await copyFile(source, resolve(racine, 'public/favicon.svg'))

console.log('Icônes générées : public/icons/ + apple-touch-icon.png + favicon.svg')
