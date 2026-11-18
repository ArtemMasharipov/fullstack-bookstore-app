/**
 * The comparison of catalogue identities: without case, with diacritics.
 * KAREL čapek is Karel Čapek, and so is a Č written as C plus a combining
 * caron; Karel Capek is another author. The unique indexes, the duplicate
 * checks of the services and npm run check:identities all use it.
 *
 * This module declares no model, so the preflight command can import it
 * without building any index.
 */
export const IDENTITY_COLLATION = Object.freeze({ locale: "cs", strength: 2 });
