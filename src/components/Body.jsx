import axios from "axios";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useStateProvider } from "../utils/StateProvider";
import { AiFillClockCircle } from "react-icons/ai";
import { reducerCases } from "../utils/Constants";

export default function Body({ headerBackground }) {
  const [{ token, selectedPlaylist, selectedPlaylistId }, dispatch] = useStateProvider();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getInitialPlaylist = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `https://api.spotify.com/v1/playlists/${selectedPlaylistId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        const selectedPlaylist = {
          id: response.data.id,
          name: response.data.name,
          description: response.data.description.startsWith("<a")
            ? ""
            : response.data.description,
          image: response.data.images[0]?.url || "", // Handle missing image case
          tracks: response.data.tracks.items.map(({ track }) => ({
            id: track.id,
            name: track.name,
            artists: track.artists.map((artist) => artist.name),
            image: track.album.images[2]?.url || "", // Handle missing image case
            duration: track.duration_ms,
            album: track.album.name,
            context_uri: track.album.uri,
            track_number: track.track_number,
          })),
        };
        dispatch({ type: reducerCases.SET_PLAYLIST, selectedPlaylist });
      } catch (error) {
        console.error("Error fetching playlist:", error);
      } finally {
        setLoading(false);
      }
    };
    getInitialPlaylist();
  }, [token, dispatch, selectedPlaylistId]);

  const playTrack = async (id, name, artists, image, context_uri, track_number) => {
    try {
      const response = await axios.put(
        `https://api.spotify.com/v1/me/player/play`,
        {
          context_uri,
          offset: { position: track_number - 1 },
          position_ms: 0,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 204) {
        const currentPlaying = { id, name, artists, image };
        dispatch({ type: reducerCases.SET_PLAYING, currentPlaying });
        dispatch({ type: reducerCases.SET_PLAYER_STATE, playerState: true });
      } else {
        dispatch({ type: reducerCases.SET_PLAYER_STATE, playerState: true });
      }
    } catch (error) {
      console.error("Error playing track:", error);
    }
  };

  const msToMinutesAndSeconds = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <Container headerBackground={headerBackground}>
      {loading ? (
        <p>Loading...</p>
      ) : (
        selectedPlaylist && (
          <>
            <div className="playlist">
              <div className="image">
                <img src={selectedPlaylist.image} alt="Selected playlist" />
              </div>
              <div className="details">
                <span className="type">PLAYLIST</span>
                <h1 className="title">{selectedPlaylist.name}</h1>
                <p className="description">{selectedPlaylist.description}</p>
              </div>
            </div>
            <div className="list">
              <div className="header-row">
                <div className="col"><span>#</span></div>
                <div className="col"><span>TITLE</span></div>
                <div className="col"><span>ALBUM</span></div>
                <div className="col"><span><AiFillClockCircle /></span></div>
              </div>
              <div className="tracks">
                {selectedPlaylist.tracks.map(
                  ({ id, name, artists, image, duration, album, context_uri, track_number }, index) => (
                    <div
                      className="row"
                      key={id}
                      onClick={() => playTrack(id, name, artists, image, context_uri, track_number)}
                    >
                      <div className="col"><span>{index + 1}</span></div>
                      <div className="col detail">
                        <div className="image">
                          <img src={image} alt="Track" />
                        </div>
                        <div className="info">
                          <span className="name">{name}</span>
                          <span>{artists.join(", ")}</span>
                        </div>
                      </div>
                      <div className="col"><span>{album}</span></div>
                      <div className="col"><span>{msToMinutesAndSeconds(duration)}</span></div>
                    </div>
                  )
                )}
              </div>
            </div>
          </>
        )
      )}
    </Container>
  );
}

const Container = styled.div`
  /* Your styled-components code */
`;
