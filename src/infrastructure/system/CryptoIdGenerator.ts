import type { IdGenerator } from '@/core/application/ports/driven/IdGenerator'

export class CryptoIdGenerator implements IdGenerator {
  newId(): string {
    if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()

    // `randomUUID` n'existe qu'en contexte sécurisé. En HTTP simple sur une IP
    // du réseau local, on retombe sur 16 octets aléatoires.
    const octets = crypto.getRandomValues(new Uint8Array(16))
    return Array.from(octets, (octet) => octet.toString(16).padStart(2, '0')).join('')
  }
}
