/**
 * Data repair for the Service Areas modal bug (fix/exif-and-area-slugs):
 * the dashboard's Service Areas modal used to submit display-name values
 * ("San Juan") instead of the canonical slug ("san-juan" — see
 * lib/area/areas.ts), so `Cleaner.serviceAreas` for anyone who re-saved
 * their areas through that modal ended up with a mix of slugs and display
 * names (and duplicates, since toggling an already-slugged area added the
 * display-name form alongside it instead of replacing it).
 *
 * All read paths (app/api/cleaners/route.ts, lib/area/get-area-page-data.ts)
 * and the write path (app/api/dashboard/cleaner/profile/route.ts) now
 * normalize around this automatically, so this script is not required for
 * correctness — it's just cleanup so the stored data matches what onboarding
 * has always written, and so `Cleaner.serviceAreas` is cheap to read
 * anywhere else in the future without re-deriving the mapping.
 *
 * Usage:
 *   npx tsx scripts/normalize-service-areas.ts             # dry run (default) - prints what would change
 *   npx tsx scripts/normalize-service-areas.ts --apply      # writes the normalized values
 */

import { PrismaClient } from '@prisma/client'
import { normalizeServiceAreas } from '../lib/area/areas'

const db = new PrismaClient()

function arraysEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((value, i) => value === b[i])
}

async function main() {
  const apply = process.argv.includes('--apply')

  const cleaners = await db.cleaner.findMany({
    select: { id: true, slug: true, serviceAreas: true },
  })

  const changes: { id: string; slug: string; before: string[]; after: string[] }[] = []

  for (const cleaner of cleaners) {
    const before = cleaner.serviceAreas
    const after = normalizeServiceAreas(before)
    if (!arraysEqual(before, after)) {
      changes.push({ id: cleaner.id, slug: cleaner.slug, before, after })
    }
  }

  if (changes.length === 0) {
    console.log('No cleaners need normalization. Nothing to do.')
    await db.$disconnect()
    return
  }

  console.log(`${apply ? 'APPLYING' : 'DRY RUN'} — ${changes.length} cleaner(s) affected:\n`)
  for (const change of changes) {
    console.log(`  ${change.slug} (${change.id})`)
    console.log(`    before: [${change.before.join(', ')}]`)
    console.log(`    after:  [${change.after.join(', ')}]`)
    if (change.after.length === 0) {
      console.log('    ⚠ normalizes to EMPTY - every entry was unrecognized, this cleaner will keep their current value unless fixed manually')
    }
    console.log('')
  }

  if (!apply) {
    console.log(`Dry run only — no changes written. Re-run with --apply to write these ${changes.length} update(s).`)
    await db.$disconnect()
    return
  }

  let updated = 0
  for (const change of changes) {
    // Never write an empty serviceAreas array — a cleaner with zero
    // recognized areas is almost certainly bad input worth a manual look,
    // not an automatic wipe of their coverage.
    if (change.after.length === 0) {
      console.log(`Skipping ${change.slug} (${change.id}) — all entries unrecognized, needs manual review`)
      continue
    }
    await db.cleaner.update({
      where: { id: change.id },
      data: { serviceAreas: change.after },
    })
    updated++
  }

  console.log(`\nDone. Updated ${updated} of ${changes.length} affected cleaner(s).`)
  await db.$disconnect()
}

main().catch(async (err) => {
  console.error(err)
  await db.$disconnect()
  process.exit(1)
})
