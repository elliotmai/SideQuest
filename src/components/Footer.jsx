const FEEDBACK_URL = 'https://ticketbooth.netlify.app/'

// Persistent, understated link to the shared bug-report / feature-request
// tool used across all of this account's apps — ported from app-template.
export default function Footer() {
  return (
    <footer className="app-footer no-print">
      <a href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer">
        Report a bug or request a feature
      </a>
    </footer>
  )
}
