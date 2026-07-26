import Link from 'next/link'

type Props = {
  /** Cleaner's display name — only the first character is used, as an initial. */
  name: string
  /**
   * Muted "photo coming soon" caption shown to everyone else. Ignored when
   * `cta` is set (the two are mutually exclusive — a viewer either sees the
   * neutral placeholder or, if it's her own card, the self-serve CTA).
   */
  caption?: string
  /** Self-serve "add your photo" affordance, shown only to the cleaner viewing her own card. */
  cta?: { label: string; href: string }
  /** Tailwind text-size class for the initial. Scale to the container. */
  initialClassName?: string
}

/**
 * Dignified stand-in for a cleaner's public photo when none has been
 * uploaded yet: a soft terracotta gradient with her initial, mirroring the
 * initials-avatar style used in the messaging threads (bg-[#F3E4DC] /
 * text-[#B56A4F]) — never "incomplete profile" language, just a quiet note
 * that a photo is on its way.
 *
 * Fills its parent — the parent must be `position: relative` with a defined
 * size (and `overflow-hidden` if it should be rounded/clipped).
 */
export function CleanerPhotoPlaceholder({ name, caption, cta, initialClassName = 'text-3xl' }: Props) {
  const initial = name.trim().charAt(0).toUpperCase() || '?'

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#F8EBE3] via-[#F3E4DC] to-[#E2C2AC]">
      <span className={`font-bold text-[#B56A4F]/80 ${initialClassName}`}>{initial}</span>
      {cta ? (
        <Link
          href={cta.href}
          className="pointer-events-auto absolute inset-x-1.5 bottom-1.5 z-10 flex items-center justify-center rounded-full bg-white/95 px-2 py-1 text-center text-[10.5px] font-semibold leading-tight text-[#B56A4F] shadow-sm transition-colors hover:bg-white"
        >
          {cta.label}
        </Link>
      ) : caption ? (
        <span className="absolute inset-x-0 bottom-1.5 truncate px-1 text-center text-[9.5px] text-[#B56A4F]/60">
          {caption}
        </span>
      ) : null}
    </div>
  )
}
