# Evolix - Personal Media Streaming Platform

A Netflix-like media streaming platform that uses Google Drive as storage. Stream your movies and TV shows with automatic metadata from TMDB, beautiful UI, and subtitle support.

![Evolix](public/svg/evolix.svg)

## Getting Started

### Prerequisites

- Node.js 18+
- Google Cloud service account with Drive API access
- (Optional) TMDB API key for metadata

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd v+
```

2. Install dependencies:

```bash
npm install
```

3. Copy the environment file:

```bash
cp .env.example .env
```

4. Configure your `.env` file (see Configuration section below)

5. Run the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## ⚙️ Configuration

### Environment Variables

| Variable             | Required | Description                                        |
| -------------------- | -------- | -------------------------------------------------- |
| `GD_SERVICE_B64`     | ✅       | Base64 encoded Google Cloud service account JSON   |
| `ENCRYPTION_KEY`     | ✅       | Secret key for encrypting file IDs                 |
| `GD_ROOT_FOLDER`     | ✅       | Google Drive folder ID containing your media       |
| `GD_IS_TEAM_DRIVE`   | ❌       | Set to `true` if using a Shared Drive              |
| `GD_SHARED_DRIVE_ID` | ❌       | Shared Drive ID (if applicable)                    |
| `TMDB_API_KEY`       | ❌       | TMDB API key for metadata (free at themoviedb.org) |
| `NEXT_PUBLIC_DOMAIN` | ❌       | Your production domain URL                         |

### Getting a Google Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable the **Google Drive API**
4. Create a **Service Account** under IAM & Admin
5. Download the JSON key file
6. Share your media folder with the service account email
7. Base64 encode the JSON: `base64 -w 0 service-account.json`

### Getting a TMDB API Key

1. Create an account at [themoviedb.org](https://www.themoviedb.org)
2. Go to Settings → API → Create → Developer
3. Copy your API Key (v3 auth)

## 📁 Folder Structure

Your Google Drive must follow this structure:

```
📁 Media Library (GD_ROOT_FOLDER)
│
├── 📁 Movies
│   │
│   ├── 📁 Inception (2010)                         ← Movie in subfolder
│   │   ├── 🎬 Inception (2010).mp4
│   │   ├── 📝 Inception (2010).srt                 ← Default subtitle
│   │   ├── 📝 Inception (2010).en.srt              ← English subtitle
│   │   └── 📝 Inception (2010).es.srt              ← Spanish subtitle
│   │
│   ├── 📁 The Dark Knight (2008) {tmdb-155}        ← With TMDB ID
│   │   ├── 🎬 The Dark Knight (2008) {tmdb-155}.mkv
│   │   └── 📝 The Dark Knight (2008) {tmdb-155}.en.srt
│   │
│   ├── 🎬 Avatar (2009).mp4                        ← Movie directly in folder
│   └── 📝 Avatar (2009).srt
│
└── 📁 TV Shows
    │
    ├── 📁 Breaking Bad (2008)
    │   ├── 📁 Season 01
    │   │   ├── 📺 Breaking Bad (2008) - s01e01 - Pilot.mkv
    │   │   ├── 📝 Breaking Bad (2008) - s01e01 - Pilot.en.srt
    │   │   ├── 📺 Breaking Bad (2008) - s01e02 - Cat's in the Bag.mkv
    │   │   ├── 📝 Breaking Bad (2008) - s01e02 - Cat's in the Bag.en.srt
    │   │   └── 📺 Breaking Bad (2008) - s01e03.mp4
    │   │
    │   ├── 📁 Season 02
    │   │   ├── 📺 Breaking Bad (2008) - s02e01 - Seven Thirty-Seven.mkv
    │   │   └── ...
    │   │
    │   └── 📁 Specials                             ← Season 0
    │       └── 📺 Breaking Bad (2008) - s00e01 - Behind the Scenes.mkv
    │
    ├── 📁 The Office (US) (2005) {tmdb-2316}       ← With TMDB ID
    │   ├── 📁 Season 01
    │   │   ├── 📺 The Office (US) (2005) - s01e01 - Pilot.mp4
    │   │   └── 📝 The Office (US) (2005) - s01e01 - Pilot.en.srt
    │   └── 📁 Season 02
    │       └── ...
    │
    └── 📁 Prehistoric Planet (2022)
        └── 📁 Season 01
            ├── 📺 Prehistoric Planet (2022) - s01e01 - Episode 01.mkv
            ├── 📝 Prehistoric Planet (2022) - s01e01 - Episode 01.en.srt
            ├── 📺 Prehistoric Planet (2022) - s01e02 - Episode 02.mkv
            └── 📝 Prehistoric Planet (2022) - s01e02 - Episode 02.en.srt
```

## 📝 Naming Conventions

### Movies

| Format       | Example                              |
| ------------ | ------------------------------------ |
| Basic        | `Movie Name (Year).ext`              |
| With TMDB ID | `Movie Name (Year) {tmdb-12345}.ext` |

### TV Shows

**Folder:** `Show Name (Year)/Season XX/Episode.ext`

| Format        | Example                                    |
| ------------- | ------------------------------------------ |
| Basic         | `Show (Year) - s01e01.ext`                 |
| With Title    | `Show (Year) - s01e01 - Episode Title.ext` |
| Multi-Episode | `Show (Year) - s01e01-e03.ext`             |
| With TMDB ID  | `Show (Year) {tmdb-12345} - s01e01.ext`    |

### Subtitles

Place subtitle files alongside videos with matching names:

| Format        | Example                       |
| ------------- | ----------------------------- |
| Default       | `Movie Name (Year).srt`       |
| With Language | `Movie Name (Year).en.srt`    |
| Episode       | `Show (Year) - s01e01.en.srt` |

**Supported formats:** `.srt`, `.vtt`, `.ass`, `.sub`, `.ssa`

**Supported language codes:** `en`, `es`, `fr`, `de`, `ja`, `ko`, `zh`, `pt`, `ar`, `hi`, and more

