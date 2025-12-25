This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Google Drive Folder Structure

Your Google Drive media library must follow this folder structure for V+ to scan and display your content correctly.

```
📁 Media Library (GD_ROOT_FOLDER)
├── 📁 Movies
│   ├── 🎬 Inception (2010).mp4
│   ├── 🎬 The Dark Knight (2008).mkv
│   ├── 🎬 Interstellar (2014) {tmdb-157336}.mp4
│   └── 🎬 Avatar (2009).avi
│
└── 📁 TV Shows
    ├── 📁 Breaking Bad (2008)
    │   ├── 📁 Season 01
    │   │   ├── 📺 Breaking Bad (2008) - s01e01 - Pilot.mkv
    │   │   ├── 📺 Breaking Bad (2008) - s01e02 - Cat's in the Bag.mkv
    │   │   └── 📺 Breaking Bad (2008) - s01e03.mp4
    │   ├── 📁 Season 02
    │   │   └── ...
    │   └── 📁 Specials
    │       └── 📺 Breaking Bad (2008) - s00e01 - Special Episode.mkv
    │
    └── 📁 The Office (US) (2005) {tmdb-2316}
        ├── 📁 Season 01
        │   └── 📺 The Office (US) (2005) - s01e01 - Pilot.mp4
        └── ...
```

### Naming Conventions

#### Movies

| Format       | Example                              |
| ------------ | ------------------------------------ |
| Basic        | `Movie Name (Year).ext`              |
| With TMDB ID | `Movie Name (Year) {tmdb-12345}.ext` |

**Examples:**

- `Inception (2010).mp4`
- `The Dark Knight (2008) {tmdb-155}.mkv`

#### TV Shows

**Folder Structure:**

```
Show Name (Year)/Season XX/Episode Files
```

**Episode Naming:**

| Format            | Example                                          |
| ----------------- | ------------------------------------------------ |
| Basic             | `Show Name (Year) - s01e01.ext`                  |
| With Title        | `Show Name (Year) - s01e01 - Episode Title.ext`  |
| Multi-Episode     | `Show Name (Year) - s01e01-e03.ext`              |
| Multi-Part        | `Show Name (Year) - s01e01 - pt1.ext`            |
| Dated Episode     | `Show Name (Year) - 2023-01-15 - Guest Name.ext` |
| With TMDB/TVDB ID | `Show Name (Year) {tmdb-12345} - s01e01.ext`     |

**Examples:**

- `Breaking Bad (2008) - s01e01 - Pilot.mkv`
- `The Office (US) (2005) - s03e10-e11 - A Benihana Christmas.mp4`
- `Doctor Who (2005) - s01e01 - pt1.avi`
- `The Daily Show (1996) - 2023-05-15 - Guest Interview.mp4`

#### Season Folders

| Folder Name               | Season Number              |
| ------------------------- | -------------------------- |
| `Season 01` or `Season 1` | Season 1                   |
| `Specials`                | Season 0 (specials/extras) |

### Supported Video Formats

`mp4`, `mkv`, `avi`, `mov`, `wmv`, `flv`, `webm`, `m4v`, `mpg`, `mpeg`, `3gp`

### Using TMDB/TVDB IDs

Add metadata IDs to help with accurate matching:

- **TMDB:** `{tmdb-12345}`
- **TVDB:** `{tvdb-12345}`

> 💡 **Tip:** You can find TMDB IDs at [themoviedb.org](https://www.themoviedb.org) in the URL of any movie/show page.

### Subtitles

Subtitle files are **auto-detected** when placed alongside video files with matching names.

**Supported Formats:** `srt`, `vtt`, `ass`, `sub`

#### Naming Convention

| Format          | Example                    |
| --------------- | -------------------------- |
| Basic (default) | `Movie Name (Year).srt`    |
| With Language   | `Movie Name (Year).en.srt` |
| With Language   | `Movie Name (Year).es.srt` |

#### Example Structure with Subtitles

```
📁 Movies/
├── 🎬 Inception (2010).mp4
├── 📝 Inception (2010).srt              ← Default subtitle (auto-selected)
├── 📝 Inception (2010).en.srt           ← English
└── 📝 Inception (2010).es.srt           ← Spanish

📁 TV Shows/Breaking Bad (2008)/Season 01/
├── 📺 Breaking Bad (2008) - s01e01 - Pilot.mkv
├── 📝 Breaking Bad (2008) - s01e01 - Pilot.srt         ← Auto-selected
└── 📝 Breaking Bad (2008) - s01e01 - Pilot.en.srt      ← English
```

#### Language Codes

Use standard ISO 639-1 language codes:

| Code | Language   |
| ---- | ---------- |
| `en` | English    |
| `es` | Spanish    |
| `fr` | French     |
| `de` | German     |
| `ja` | Japanese   |
| `ko` | Korean     |
| `zh` | Chinese    |
| `pt` | Portuguese |
| `ar` | Arabic     |
| `hi` | Hindi      |

> 💡 **Auto-Select:** The player will automatically select the first available subtitle. Subtitles without a language code are prioritized as the default.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
