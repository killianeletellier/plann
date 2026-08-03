/** Génère un PIN numérique aléatoire de 4 chiffres. */
export function generateRandomPin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}
