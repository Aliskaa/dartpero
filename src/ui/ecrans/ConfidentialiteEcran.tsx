import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'
import { classesBouton } from '@/ui/composants/commun/Button'
import { EnTeteEcran } from '@/ui/composants/commun/EnTeteEcran'
import { Panneau } from '@/ui/composants/commun/Panneau'
import {
  DATE_MISE_A_JOUR_CONFIDENTIALITE,
  MENTION_CONTACT,
  MENTION_EDITEUR,
  MENTION_HEBERGEUR_ADRESSE,
  MENTION_HEBERGEUR_ENTITE,
  MENTION_HEBERGEUR_SERVICE,
  RETOUR_REGLAGES,
  SECTIONS_CONFIDENTIALITE,
  SOUS_TITRE_CONFIDENTIALITE,
  TERME_CONTACT,
  TERME_EDITEUR,
  TERME_HEBERGEUR,
  TITRE_CONFIDENTIALITE,
  TITRE_MENTIONS_LEGALES,
} from '@/ui/labels'

const MENTIONS = [
  { terme: TERME_EDITEUR, valeurs: [MENTION_EDITEUR] },
  { terme: TERME_CONTACT, valeurs: [MENTION_CONTACT] },
  {
    terme: TERME_HEBERGEUR,
    valeurs: [MENTION_HEBERGEUR_SERVICE, MENTION_HEBERGEUR_ENTITE, MENTION_HEBERGEUR_ADRESSE],
  },
] as const

/** Politique de confidentialité (URL publique de la Play Console) : du texte de `labels.ts`, un engagement public. */
export const ConfidentialiteEcran = () => (
  <main className="flex flex-1 flex-col gap-4 pb-4">
    <EnTeteEcran titre={TITRE_CONFIDENTIALITE} sousTitre={SOUS_TITRE_CONFIDENTIALITE} />

    {/* `max-w-prose` : en paysage, une ligne de toute la largeur ne se lit plus. */}
    <div className="flex w-full max-w-prose flex-col gap-3 px-4">
      <p className="text-xs text-craie-2">{DATE_MISE_A_JOUR_CONFIDENTIALITE}</p>

      {SECTIONS_CONFIDENTIALITE.map((section) => (
        <Panneau
          key={section.titre}
          titre={section.titre}
          contenuClassName="flex flex-col gap-3 p-4"
        >
          {section.paragraphes.map((paragraphe) => (
            <p key={paragraphe} className="text-sm text-craie-2">
              {paragraphe}
            </p>
          ))}
        </Panneau>
      ))}

      <Panneau titre={TITRE_MENTIONS_LEGALES} contenuClassName="p-4">
        <dl className="flex flex-col gap-3 text-sm">
          {MENTIONS.map(({ terme, valeurs }) => (
            <div key={terme} className="flex flex-col gap-0.5">
              <dt className="font-score text-xs uppercase tracking-widest text-craie-2">{terme}</dt>
              {valeurs.map((valeur) => (
                <dd key={valeur} className="text-craie">
                  {valeur}
                </dd>
              ))}
            </div>
          ))}
        </dl>
      </Panneau>

      <Link to="/reglages" className={classesBouton('secondaire')}>
        <ArrowLeft aria-hidden="true" className="size-4" />
        {RETOUR_REGLAGES}
      </Link>
    </div>
  </main>
)
