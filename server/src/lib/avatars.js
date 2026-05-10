import crypto from 'crypto';

export function getGravatarUrl(email) {
  // If we want to use the local default_dp.png as the fallback for everyone
  // who doesn't have a custom URL set in the DB.
  return '/default_dp.png';
}
