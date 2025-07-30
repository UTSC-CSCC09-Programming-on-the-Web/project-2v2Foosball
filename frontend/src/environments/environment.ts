// This file is for production environment settings.
export const environment = {
  production: true,
  apiUrl: '//api.foosball.games/api',
  socketUrl: 'https://api.foosball.games',
  stripePublishableKey:
    'pk_test_51RknN3PHZb7FyiFgijP5bJ2SkQFb0YfG2oRzbf6hd2uwMerRIpZrT9ftVS3OG0UqwpAjnIUG0ozAGvZzQyQK7GPJ00rZdel6r1',
  name: 'Foosball',
  githubClientId: 'Ov23liymjdBYAevI7lcu',
  githubRedirectUri: 'https://api.foosball.games/api/auth/github/callback',
  googleClientId:
    '252031120749-7cn99m7v64t1ef2r4c2bft6rdsve2e05.apps.googleusercontent.com',
  googleRedirectUri: 'https://api.foosball.games/api/auth/google/callback',
};
