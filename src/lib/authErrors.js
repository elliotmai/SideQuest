const FRIENDLY_ERRORS = {
  'auth/unauthorized-domain':
    "This domain isn't authorized for Google sign-in yet — add it under Firebase Console → Authentication → Settings → Authorized domains.",
  'auth/popup-closed-by-user': null, // user cancelled on purpose, not an error to show
  'auth/network-request-failed': 'Network error — check your connection and try again.',
}

export function describeAuthError(err) {
  if (!err) return null
  if (err.code in FRIENDLY_ERRORS) return FRIENDLY_ERRORS[err.code]
  return `Sign-in failed (${err.code || 'unknown error'}) — ${err.message || 'try again.'}`
}
