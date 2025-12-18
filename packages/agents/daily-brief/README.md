## P0 Daily Brief

Run the P0 Daily Brief end-to-end through the Exec Admin front door:

1. Start the API (`cd packages/api && npm run dev` or `npm start` depending on your setup).
2. Call `POST /exec-admin/p0/daily-brief` with JSON:
   ```json
   { "user": "darnell", "date": "2025-01-15", "runId": "optional-run-id" }
   ```
3. Response is the strict brief schema:
   ```json
   {
     "date": "2025-01-15",
     "topPriorities": [{ "title": "...", "why": "...", "nextStep": "..." }],
     "focusBlock": { "start": "...", "end": "...", "theme": "..." },
     "calendarSummary": { "meetings": 0, "highlights": [] },
     "inboxHighlights": { "items": [] },
     "risks": ["..."],
     "suggestedActions": [{ "type": "task", "title": "...", "details": "..." }]
   }
   ```
4. If calendar/inbox integrations are not configured, the agent still responds with empty arrays and logs warnings; pass `runId` to trace the request in logs.
