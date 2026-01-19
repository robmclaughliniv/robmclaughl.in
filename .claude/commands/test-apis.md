# /test-apis Command

> Test external API integrations

## Purpose

Verify that external API integrations (OpenAI, etc.) are working correctly before deploying.

## Usage

```
/test-apis [api-name]
```

## Available APIs

| API | Status | Test Endpoint |
|-----|--------|---------------|
| OpenAI DALL-E | Planned | /api/vibe/generate-image |
| Suno | Research | N/A |

## Steps

### 1. Check Environment Variables

Verify required environment variables are set:

```bash
# Check if API key is configured (don't print value!)
echo "OPENAI_API_KEY: ${OPENAI_API_KEY:+[SET]}"
```

### 2. Test OpenAI Connection

```typescript
// Quick connectivity test
const response = await fetch('https://api.openai.com/v1/models', {
  headers: {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
  },
});
console.log('OpenAI Status:', response.status);
```

### 3. Test Image Generation (if applicable)

```typescript
// Test DALL-E generation
const response = await fetch('https://api.openai.com/v1/images/generations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
  },
  body: JSON.stringify({
    model: 'dall-e-3',
    prompt: 'A simple test image',
    n: 1,
    size: '1024x1024',
  }),
});
```

### 4. Test Lambda Endpoint (if deployed)

```bash
curl -X POST https://api.robmclaughl.in/vibe/generate-image \
  -H "Content-Type: application/json" \
  -d '{"mood": "chill", "captchaToken": "test"}'
```

## Output Format

```
API Test Results
================

OpenAI API
----------
✅ Connection: OK
✅ Authentication: Valid
✅ Model Access: dall-e-3 available
⚠️  Rate Limit: 5 requests remaining

Lambda Endpoint
---------------
⏭️  Not deployed yet

Summary
-------
All critical APIs operational.
Estimated cost for test: $0.00
```

## Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| api-name | Specific API to test | all |

## Notes

- Never log API keys
- Tests may incur small costs
- Some tests require deployed Lambda
- Use test/sandbox endpoints when available
