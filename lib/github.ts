import axios from 'axios';

const GITHUB_TOKEN = process.env.NEXT_PUBLIC_GITHUB_TOKEN;

const QUERY = `
  query BattleStats($username: String!) {
    user(login: $username) {
      login
      avatarUrl
      followers { totalCount }
      contributionsCollection {
        contributionCalendar { totalContributions }
      }
      repositories(first: 50, ownerAffiliations: OWNER, orderBy: {field: STARGAZERS, direction: DESC}) {
        nodes { stargazerCount }
      }
    }
  }
`;

export async function getPlayerStats (username: string) {
    try {
        const response = await axios.post(
            'https://api.github.com/graphql',
            {query: QUERY, variables: {username}},
            {headers: { Authorization: `Bearer ${GITHUB_TOKEN}`}}
        );
        return response.data.data.user;
    }   catch (error) {
        console.error("API Error:", error);
        return null;
    }
}