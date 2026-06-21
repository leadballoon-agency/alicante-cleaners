// Files builder/operator feedback into GitHub Issues — the dev backlog.
// Used by the admin AI assistant's `report_feedback` tool so a manager can
// just say "bug: X" or "idea: Y" and it lands where the work gets picked up.
//
// Requires env: GITHUB_FEEDBACK_TOKEN (fine-grained PAT with Issues: Read+Write
// on the repo). Optional: GITHUB_FEEDBACK_REPO (default below).

const DEFAULT_REPO = 'leadballoon-agency/alicante-cleaners'

type FeedbackType = 'bug' | 'feature' | 'idea' | 'improvement'

const TYPE_LABEL: Record<FeedbackType, string> = {
  bug: 'bug',
  feature: 'enhancement',
  idea: 'idea',
  improvement: 'enhancement',
}
const TYPE_EMOJI: Record<FeedbackType, string> = {
  bug: '🐛', feature: '✨', idea: '💡', improvement: '🔧',
}

export async function createFeedbackIssue(input: {
  type: FeedbackType
  title: string
  details: string
  submittedBy?: string
}): Promise<{ ok: true; url: string; number: number } | { ok: false; error: string }> {
  const token = process.env.GITHUB_FEEDBACK_TOKEN
  if (!token) {
    return { ok: false, error: 'Feedback backlog not configured yet (missing GITHUB_FEEDBACK_TOKEN).' }
  }
  const repo = process.env.GITHUB_FEEDBACK_REPO || DEFAULT_REPO

  const emoji = TYPE_EMOJI[input.type] || '📝'
  const body = [
    input.details.trim(),
    '',
    '---',
    `*Submitted via the VillaCare assistant${input.submittedBy ? ` by ${input.submittedBy}` : ''} on ${new Date().toISOString().split('T')[0]}.*`,
  ].join('\n')

  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: `${emoji} ${input.title}`,
        body,
        labels: ['from-app', TYPE_LABEL[input.type] || 'feedback'],
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return { ok: false, error: `GitHub returned ${res.status}. ${text.slice(0, 200)}` }
    }
    const issue = (await res.json()) as { html_url: string; number: number }
    return { ok: true, url: issue.html_url, number: issue.number }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error creating issue' }
  }
}
