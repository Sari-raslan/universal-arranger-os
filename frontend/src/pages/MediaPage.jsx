import React, { useEffect, useState } from "react";

export default function MediaPage() {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    fetch("/media/manifest.json")
      .then((res) => res.json())
      .then((data) => setVideos(data.videos || []))
      .catch(() => setVideos([]));
  }, []);

  return (
    <main className="uaos-media-page">
      <section className="uaos-media-hero">
        <p className="uaos-kicker">UAOS Media / GEO Visual Style</p>
        <h1>Universal Arranger OS</h1>
        <p>
          A cinematic music workstation interface for Web, Android, Windows Desktop,
          MIDI, and OMR workflows.
        </p>
      </section>

      <section className="uaos-media-grid">
        {videos.map((video, index) => (
          <article className="uaos-video-card" key={index}>
            {video.src ? (
              <video src={video.src} controls preload="metadata" />
            ) : (
              <div className="uaos-video-placeholder">
                Add GEO / UAOS video files to frontend/public/media
              </div>
            )}

            <div>
              <h3>{video.title}</h3>
              <p>{video.original || video.file}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="uaos-media-info">
        <h2>Design Direction</h2>
        <p>
          The UAOS interface should follow the same visual language as the promo videos:
          dark cinematic background, neon blue/purple gradients, glass panels,
          large music-workstation controls, and clear download actions.
        </p>
      </section>
    </main>
  );
}