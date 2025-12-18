# Content Engine (Phase 6 → Content Activation)

The Content Engine orchestrates multiple content/brand agents to produce a weekly content pack on demand. A single request like “Create this week’s Elevated Movements content” will extract themes, draft cross-channel copy, apply EM brand voice, and produce visual direction for carousels and short video.

## Agents Used
- **Content Synthesizer (P0)** – drafts posts, carousel copy, newsletter snippets, scripts.
- **Brand Storyteller (P1)** – applies EM voice and channel-specific refinements.
- **Creative Director (P1)** – generates Canva prompts, storyboards, and visual direction.
- Future/optional theme sources: Insight Analyst, JournalAgent, NicheAgent, PurposeAgent, RhythmAgent (placeholders handled gracefully).

## API Endpoint
**POST** `/api/content/week`
Request:
```json
{
  "scope": "elevated_movements",
  "channels": ["linkedin", "instagram", "newsletter"],
  "tone": "standard_week",
  "focus": "rest_and_leadership"
}
```
Response: `{ success: true, pack: { ...weeklyContentPack } }`

## Executive Admin Intent
- Intent key: `content.weeklyPack`
- The Executive Admin maps high-level prompts (e.g., “Create this week’s Elevated Movements content”) to the weekly content workflow and returns the structured pack.

## Sample Output Shape
```json
{
  "weekSummary": "...",
  "themes": ["rest", "leadership", "community"],
  "linkedinPosts": ["..."],
  "instagramPosts": ["..."],
  "newsletterSections": ["..."],
  "videoScripts": ["..."],
  "carousel": {
    "slides": [{ "title": "...", "body": "...", "cta": "..." }],
    "canvaPrompt": "..."
  },
  "visualGuidance": {
    "general": "...",
    "video": "...",
    "newsletter": "..."
  },
  "meta": {
    "generatedAt": "...",
    "sourceAgents": ["content_synthesizer", "brand_storyteller", "creative_director"],
    "scope": "elevated_movements",
    "channels": ["linkedin", "instagram", "newsletter"],
    "tone": "standard_week",
    "focus": "rest_and_leadership"
  }
}
```

## Developer Notes / TODOs
- LLM calls are placeholder stubs; swap in existing OpenAI/LLM wrappers for production.
- Theme extraction currently uses a stub; wire to Insight Analyst / Journal / Niche / Purpose / Rhythm agents when available.
- Add richer validation and channel-specific templates as content matures.
