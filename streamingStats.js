const axios = require("axios");

// Utility to fetch stats from Apple Music
async function fetchAppleMusicStats(accessToken) {
  try {
    const response = await axios.get("https://api.music.apple.com/v1/me/recent/played", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const topArtists = response.data.data.map((item) => item.attributes.artistName);
    const topTracks = response.data.data.map((item) => item.attributes.name);

    return {
      topArtists,
      topTracks,
      totalListeningHoursLastYear: Math.floor(Math.random() * 300), // Placeholder for now
    };
  } catch (error) {
    console.error("Error fetching Apple Music stats:", error);
    return null;
  }
}

// Utility to fetch stats from YouTube Music
async function fetchYouTubeMusicStats(accessToken) {
  try {
    const response = await axios.get("https://www.googleapis.com/youtube/v3/playlists", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        part: "snippet,contentDetails",
        mine: true,
      },
    });

    const topPlaylists = response.data.items.map((item) => item.snippet.title);

    return {
      topPlaylists,
      totalListeningHoursLastYear: Math.floor(Math.random() * 200), // Placeholder for now
    };
  } catch (error) {
    console.error("Error fetching YouTube Music stats:", error);
    return null;
  }
}

module.exports = {
  fetchAppleMusicStats,
  fetchYouTubeMusicStats,
};