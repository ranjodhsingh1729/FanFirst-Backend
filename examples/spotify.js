// Import the required modules
const axios = require("axios");
const NodeCache = require("node-cache");
const fs = require("fs");
const path = require("path");

// Initialize a cache with a default TTL of 10 minutes
const cache = new NodeCache({ stdTTL: 600 });

// Create a write stream for logging
const logStream = fs.createWriteStream(path.join(__dirname, "api.log"), {
  flags: "a",
});

// Spotify Web API base URL
const SPOTIFY_API_BASE_URL = "https://api.spotify.com/v1";

/**
 * Logs API requests and responses to a file.
 * @param {string} type - The type of log ('REQUEST' or 'RESPONSE').
 * @param {string} endpoint - The API endpoint being accessed.
 * @param {Object} data - The data to log (request params or response data).
 */
function logApiInteraction(type, endpoint, data) {
  const timestamp = new Date().toISOString();
  logStream.write(
    `[${timestamp}] ${type} ${endpoint}: ${JSON.stringify(data)}\n`,
  );
}

/**
 * Generalized function to make API requests to Spotify Web API with caching, error handling, and rate limiting.
 * @param {string} endpoint - The API endpoint to call (e.g., 'me', 'tracks').
 * @param {string} accessToken - The OAuth access token for authentication.
 * @param {Object} [params={}] - Optional query parameters to include in the request.
 * @returns {Promise<Object>} - The response data from the Spotify API.
 * @throws {Error} - Throws an error if the API request fails.
 */
async function makeSpotifyApiRequest(endpoint, accessToken, params = {}) {
  const url = new URL(`${SPOTIFY_API_BASE_URL}/${endpoint}`);
  Object.keys(params).forEach((key) =>
    url.searchParams.append(key, params[key]),
  );

  const cacheKey = `${url.toString()}_${accessToken}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    console.log(`Cache hit for ${url.toString()}`);
    return cachedData;
  }

  try {
    logApiInteraction("REQUEST", endpoint, params);
    const response = await axios.get(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Store the response in the cache
    cache.set(cacheKey, response.data);
    logApiInteraction("RESPONSE", endpoint, response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      const { status, headers } = error.response;

      // Handle rate limiting (HTTP 429)
      if (status === 429) {
        const retryAfter = headers["retry-after"] || 1; // Default to 1 second if not provided
        console.warn(
          `Rate limit exceeded. Retrying after ${retryAfter} seconds...`,
        );
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
        return makeSpotifyApiRequest(endpoint, accessToken, params); // Retry the request
      }

      // Handle other HTTP errors
      console.error(
        `Spotify API error (status: ${status}):`,
        error.response.data,
      );
      throw new Error(
        `Spotify API error: ${error.response.data.error.message}`,
      );
    } else {
      console.error("Network or other error:", error.message);
      throw new Error(
        "An unexpected error occurred while making the API request.",
      );
    }
  }
}

/**
 * Generalized function to handle paginated responses from Spotify Web API.
 * @param {string} endpoint - The API endpoint to call (e.g., 'me', 'tracks').
 * @param {string} accessToken - The OAuth access token for authentication.
 * @param {Object} [params={}] - Optional query parameters to include in the request.
 * @returns {Promise<Object[]>} - An array of all items from paginated responses.
 * @throws {Error} - Throws an error if the API request fails.
 */
async function fetchAllPaginatedData(endpoint, accessToken, params = {}) {
  let allItems = [];
  let nextUrl = `${SPOTIFY_API_BASE_URL}/${endpoint}`;

  do {
    const url = new URL(nextUrl);
    Object.keys(params).forEach((key) =>
      url.searchParams.append(key, params[key]),
    );

    try {
      const response = await axios.get(url.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      allItems = allItems.concat(response.data.items);
      nextUrl = response.data.next; // Spotify API provides the next URL for pagination
    } catch (error) {
      console.error(
        `Error fetching paginated data from endpoint ${endpoint}:`,
        error,
      );
      throw error;
    }
  } while (nextUrl);

  return allItems;
}

/**
 * Fetch the current user's Spotify profile.
 * @param {string} accessToken - The OAuth access token for authentication.
 * @returns {Promise<Object>} - The user's profile data.
 */
async function getCurrentUserProfile(accessToken) {
  return makeSpotifyApiRequest("me", accessToken);
}

/**
 * Fetch the artists followed by the current user.
 * @param {string} accessToken - The OAuth access token for authentication.
 * @returns {Promise<Object>} - The followed artists data.
 */
async function getFollowedArtists(accessToken) {
  return makeSpotifyApiRequest("me/following", accessToken, { type: "artist" });
}

/**
 * Fetch the tracks saved by the current user.
 * @param {string} accessToken - The OAuth access token for authentication.
 * @returns {Promise<Object>} - The saved tracks data.
 */
async function getUserSavedTracks(accessToken) {
  return makeSpotifyApiRequest("me/tracks", accessToken);
}

/**
 * Fetch the playlists of the current user.
 * @param {string} accessToken - The OAuth access token for authentication.
 * @returns {Promise<Object>} - The user's playlists data.
 */
async function getCurrentUserPlaylists(accessToken) {
  return makeSpotifyApiRequest("me/playlists", accessToken);
}

/**
 * Fetch the albums saved by the current user.
 * @param {string} accessToken - The OAuth access token for authentication.
 * @returns {Promise<Object>} - The saved albums data.
 */
async function getUserSavedAlbums(accessToken) {
  return makeSpotifyApiRequest("me/albums", accessToken);
}

/**
 * Fetch the top items (artists or tracks) of the current user.
 * @param {string} type - The type of top items to fetch ('artists' or 'tracks').
 * @param {string} accessToken - The OAuth access token for authentication.
 * @returns {Promise<Object>} - The top items data.
 */
async function getTopItems(type, accessToken) {
  return makeSpotifyApiRequest(`me/top/${type}`, accessToken);
}

/**
 * Fetch specific tracks by their IDs.
 * @param {string[]} trackIds - An array of track IDs to fetch.
 * @param {string} accessToken - The OAuth access token for authentication.
 * @returns {Promise<Object>} - The tracks data.
 */
async function getTracks(trackIds, accessToken) {
  return makeSpotifyApiRequest("tracks", accessToken, {
    ids: trackIds.join(","),
  });
}

/**
 * Fetch a specific playlist by its ID.
 * @param {string} playlistId - The ID of the playlist to fetch.
 * @param {string} accessToken - The OAuth access token for authentication.
 * @returns {Promise<Object>} - The playlist data.
 */
async function getPlaylist(playlistId, accessToken) {
  return makeSpotifyApiRequest(`playlists/${playlistId}`, accessToken);
}

/**
 * Fetch the items (tracks) of a specific playlist by its ID.
 * @param {string} playlistId - The ID of the playlist to fetch items from.
 * @param {string} accessToken - The OAuth access token for authentication.
 * @returns {Promise<Object>} - The playlist items data.
 */
async function getPlaylistItems(playlistId, accessToken) {
  return makeSpotifyApiRequest(`playlists/${playlistId}/tracks`, accessToken);
}

/**
 * Fetch a specific artist by their ID.
 * @param {string} artistId - The ID of the artist to fetch.
 * @param {string} accessToken - The OAuth access token for authentication.
 * @returns {Promise<Object>} - The artist data.
 */
async function getArtist(artistId, accessToken) {
  return makeSpotifyApiRequest(`artists/${artistId}`, accessToken);
}

/**
 * Fetch the top tracks of a specific artist by their ID.
 * @param {string} artistId - The ID of the artist to fetch top tracks for.
 * @param {string} country - The country code for the top tracks (e.g., 'US').
 * @param {string} accessToken - The OAuth access token for authentication.
 * @returns {Promise<Object>} - The artist's top tracks data.
 */
async function getArtistTopTracks(artistId, country, accessToken) {
  return makeSpotifyApiRequest(`artists/${artistId}/top-tracks`, accessToken, {
    country,
  });
}

/**
 * Fetch the albums of a specific artist by their ID.
 * @param {string} artistId - The ID of the artist to fetch albums for.
 * @param {string} accessToken - The OAuth access token for authentication.
 * @returns {Promise<Object>} - The artist's albums data.
 */
async function getArtistAlbums(artistId, accessToken) {
  return makeSpotifyApiRequest(`artists/${artistId}/albums`, accessToken);
}

/**
 * Fetch the related artists of a specific artist by their ID.
 * @param {string} artistId - The ID of the artist to fetch related artists for.
 * @param {string} accessToken - The OAuth access token for authentication.
 * @returns {Promise<Object>} - The related artists data.
 */
async function getArtistRelatedArtists(artistId, accessToken) {
  return makeSpotifyApiRequest(
    `artists/${artistId}/related-artists`,
    accessToken,
  );
}

/**
 * Fetch a specific album by its ID.
 * @param {string} albumId - The ID of the album to fetch.
 * @param {string} accessToken - The OAuth access token for authentication.
 * @returns {Promise<Object>} - The album data.
 */
async function getAlbum(albumId, accessToken) {
  return makeSpotifyApiRequest(`albums/${albumId}`, accessToken);
}

/**
 * Fetch several albums by their IDs.
 * @param {string[]} albumIds - An array of album IDs to fetch.
 * @param {string} accessToken - The OAuth access token for authentication.
 * @returns {Promise<Object>} - The albums data.
 */
async function getSeveralAlbums(albumIds, accessToken) {
  return makeSpotifyApiRequest("albums", accessToken, {
    ids: albumIds.join(","),
  });
}

/**
 * Fetch the tracks of a specific album by its ID.
 * @param {string} albumId - The ID of the album to fetch tracks for.
 * @param {string} accessToken - The OAuth access token for authentication.
 * @returns {Promise<Object>} - The album tracks data.
 */
async function getAlbumTracks(albumId, accessToken) {
  return makeSpotifyApiRequest(`albums/${albumId}/tracks`, accessToken);
}

module.exports = {
  getTopItems,
  getCurrentUserProfile,
  getFollowedArtists,
  getUserSavedTracks,
  getTracks,
  getPlaylist,
  getPlaylistItems,
  getCurrentUserPlaylists,
  getArtist,
  getArtistTopTracks,
  getArtistAlbums,
  getArtistRelatedArtists,
  getAlbum,
  getSeveralAlbums,
  getAlbumTracks,
  getUserSavedAlbums,
  fetchAllPaginatedData,
};
