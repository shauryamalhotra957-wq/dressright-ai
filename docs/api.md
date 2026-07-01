# API

## `GET /api/session`

Creates a session and returns:

```json
{
  "csrfToken": "token",
  "maxUploadBytes": 5242880,
  "retainedUploads": false
}
```

## `POST /api/upload`

Headers:

- `Content-Type`: `image/png`, `image/jpeg`, or `image/webp`
- `X-File-Name`: original filename
- `X-CSRF-Token`: session token

Body: raw image bytes.

## `POST /api/recommendations`

Headers:

- `Content-Type`: `application/json`
- `X-CSRF-Token`: session token

Body:

```json
{
  "profile": {
    "styleMode": "minimal",
    "serviceMode": "hybrid",
    "occasions": ["office", "travel"],
    "colors": ["navy", "charcoal"],
    "budget": 900
  }
}
```

## `POST /api/checkout`

Creates a demo order. Production should redirect to a hosted payment provider.
