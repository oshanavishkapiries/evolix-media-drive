// Evolix Player Core - JWPlayer with Netflix Skin
// Reads video data from URL parameter and configures player

(function () {
  // Get data from URL parameter
  function getPlayerData() {
    const urlParams = new URLSearchParams(window.location.search);
    const encodedData = urlParams.get('data');

    if (!encodedData) {
      console.error('No player data found in URL');
      return null;
    }

    try {
      // Decode base64 and parse JSON
      const jsonString = decodeURIComponent(escape(atob(decodeURIComponent(encodedData))));
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Failed to decode player data:', error);
      return null;
    }
  }

  // Initialize player with data
  function initPlayer(data) {
    if (!data) {
      // Show error state
      document.getElementById('player').innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #000; color: #fff; font-family: 'Rubik', Arial, sans-serif;">
          <h2 style="color: #FFD700;">Error Loading Video</h2>
          <p style="color: #888;">No video data found. Please go back and try again.</p>
          <button onclick="history.back()" style="margin-top: 20px; padding: 12px 24px; background: #FFD700; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">
            Go Back
          </button>
        </div>
      `;
      return;
    }

    // Build playlist item
    const playlistItem = {
      title: data.title || 'Unknown Title',
      description: data.description || "You're Watching",
      image: data.poster || '',
      sources: data.sources || [],
      tracks: []
    };

    // Add captions if available
    if (data.captions && data.captions.length > 0) {
      playlistItem.tracks = data.captions.map(caption => ({
        file: caption.file,
        label: caption.label,
        kind: caption.kind || 'captions',
        default: caption.default || false
      }));
    }

    // Setup JWPlayer
    const playerInstance = jwplayer("player").setup({
      controls: true,
      sharing: false,
      displaytitle: true,
      displaydescription: true,
      abouttext: "Evolix Player",
      aboutlink: "/",

      skin: {
        name: "netflix"
      },

      logo: {
        file: "/svg/evolix.svg",
        link: "/",
        position: "top-left"
      },

      captions: {
        color: "#FFF",
        fontSize: 18,
        backgroundOpacity: 0,
        edgeStyle: "raised"
      },

      playlist: [playlistItem]
    });

    // Player ready event
    playerInstance.on("ready", function () {
      console.log('Evolix Player ready');

      // Move the timeslider in-line with other controls
      const playerContainer = playerInstance.getContainer();
      const buttonContainer = playerContainer.querySelector(".jw-button-container");
      const spacer = buttonContainer.querySelector(".jw-spacer");
      const timeSlider = playerContainer.querySelector(".jw-slider-time");

      if (spacer && timeSlider) {
        buttonContainer.replaceChild(timeSlider, spacer);
      }

      // Forward 10 seconds button
      const rewindContainer = playerContainer.querySelector(".jw-display-icon-rewind");
      if (rewindContainer) {
        const forwardContainer = rewindContainer.cloneNode(true);
        const forwardDisplayButton = forwardContainer.querySelector(".jw-icon-rewind");
        if (forwardDisplayButton) {
          forwardDisplayButton.style.transform = "scaleX(-1)";
          forwardDisplayButton.ariaLabel = "Forward 10 Seconds";
          forwardDisplayButton.onclick = () => {
            playerInstance.seek(playerInstance.getPosition() + 10);
          };
        }

        const nextContainer = playerContainer.querySelector(".jw-display-icon-next");
        if (nextContainer && nextContainer.parentNode) {
          nextContainer.parentNode.insertBefore(forwardContainer, nextContainer);
          nextContainer.style.display = "none";
        }

        // Control bar forward button
        const rewindControlBarButton = buttonContainer.querySelector(".jw-icon-rewind");
        if (rewindControlBarButton) {
          const forwardControlBarButton = rewindControlBarButton.cloneNode(true);
          forwardControlBarButton.style.transform = "scaleX(-1)";
          forwardControlBarButton.ariaLabel = "Forward 10 Seconds";
          forwardControlBarButton.onclick = () => {
            playerInstance.seek(playerInstance.getPosition() + 10);
          };
          rewindControlBarButton.parentNode.insertBefore(
            forwardControlBarButton,
            rewindControlBarButton.nextElementSibling
          );
        }
      }
    });

    // Handle errors
    playerInstance.on("error", function (error) {
      console.error('Player error:', error);
    });

    // Back button with keyboard
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.key === 'Backspace') {
        e.preventDefault();
        history.back();
      }
    });
  }

  // Start the player when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      const data = getPlayerData();
      initPlayer(data);
    });
  } else {
    const data = getPlayerData();
    initPlayer(data);
  }
})();
