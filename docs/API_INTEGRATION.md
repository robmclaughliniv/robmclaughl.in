# API Integration Guide

> Documentation for external API integrations

## Overview

This document covers the integration of external APIs used in robmclaughl.in, primarily for the Vibe Generator's AI features.

---

## APIs in Use

| API | Provider | Purpose | Status |
|-----|----------|---------|--------|
| OpenAI DALL-E | OpenAI | Image generation | Planned |
| Suno | Suno AI | Music generation | Research |

---

## OpenAI DALL-E Integration

### Overview

DALL-E 3 is used to generate unique visual backgrounds for the Vibe Generator.

### API Details

| Attribute | Value |
|-----------|-------|
| **Endpoint** | `https://api.openai.com/v1/images/generations` |
| **Authentication** | Bearer token (API key) |
| **Model** | `dall-e-3` |
| **Rate Limits** | Varies by tier |

### Setup

1. **Create OpenAI Account**
   - Sign up at https://platform.openai.com
   - Add payment method
   - Generate API key

2. **Store API Key**
   - Add to AWS Secrets Manager or Parameter Store
   - Reference in Lambda environment variables
   - NEVER commit to repository

3. **Configure Lambda**
   ```hcl
   # In Terraform
   environment {
     variables = {
       OPENAI_API_KEY = aws_ssm_parameter.openai_key.value
     }
   }
   ```

### Request Format

```typescript
interface DALLERequest {
  model: 'dall-e-3';
  prompt: string;
  n: 1;  // DALL-E 3 only supports 1
  size: '1024x1024' | '1792x1024' | '1024x1792';
  quality: 'standard' | 'hd';
  response_format: 'url' | 'b64_json';
}
```

### Example Request

```typescript
const response = await fetch('https://api.openai.com/v1/images/generations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
  },
  body: JSON.stringify({
    model: 'dall-e-3',
    prompt: 'Cozy lofi aesthetic room at night, warm lighting, plants, vinyl records, digital art style',
    n: 1,
    size: '1792x1024',
    quality: 'standard',
  }),
});

const data = await response.json();
// data.data[0].url contains the image URL
```

### Response Format

```json
{
  "created": 1706012345,
  "data": [
    {
      "revised_prompt": "A cozy lofi aesthetic room at night...",
      "url": "https://oaidalleapiprodscus.blob.core.windows.net/..."
    }
  ]
}
```

### Prompt Engineering

**Template for Vibe Generator:**
```typescript
function generatePrompt(mood: string, style?: string): string {
  const basePrompt = `Lofi aesthetic scene, ${mood} mood`;
  const visualStyle = style || 'cozy indoor setting';
  const qualifiers = 'warm lighting, detailed, digital art, atmospheric';

  return `${basePrompt}, ${visualStyle}, ${qualifiers}`;
}

// Examples:
// "chill" -> "Lofi aesthetic scene, chill mood, cozy indoor setting, warm lighting..."
// "focus" -> "Lofi aesthetic scene, focus mood, minimal desk setup, warm lighting..."
```

**Mood-Specific Prompts:**

| Mood | Prompt Additions |
|------|------------------|
| chill | cozy room, plants, soft colors, relaxed |
| focus | minimal desk, clean space, morning light |
| ambient | night scene, city lights, rain, moody |
| late-night | neon signs, urban, synthwave colors |

### Error Handling

```typescript
try {
  const response = await generateImage(prompt);
  return { success: true, imageUrl: response.url };
} catch (error) {
  if (error.status === 429) {
    // Rate limited
    return { success: false, error: 'Too many requests. Please wait.' };
  }
  if (error.status === 400) {
    // Content policy violation
    return { success: false, error: 'Unable to generate this image.' };
  }
  // Other errors
  return { success: false, error: 'Generation failed. Please try again.' };
}
```

### Cost Management

| Size | Quality | Cost |
|------|---------|------|
| 1024x1024 | standard | $0.040 |
| 1024x1024 | hd | $0.080 |
| 1792x1024 | standard | $0.080 |
| 1792x1024 | hd | $0.120 |

**Cost Control Measures:**
1. Use standard quality (sufficient for backgrounds)
2. Cache generated images in S3
3. Rate limit per user
4. Daily budget cap in Lambda

### Image Storage

Generated images should be copied to S3 for:
- Faster repeated access
- Cost savings (no re-generation)
- URL persistence (OpenAI URLs expire)

```typescript
async function saveToS3(imageUrl: string, key: string): Promise<string> {
  // 1. Fetch image from OpenAI URL
  const response = await fetch(imageUrl);
  const buffer = await response.arrayBuffer();

  // 2. Upload to S3
  await s3.putObject({
    Bucket: 'robmclaughl-in-assets',
    Key: `vibe-visuals/${key}.webp`,
    Body: Buffer.from(buffer),
    ContentType: 'image/webp',
  });

  // 3. Return CloudFront URL
  return `https://assets.robmclaughl.in/vibe-visuals/${key}.webp`;
}
```

---

## Suno AI Integration

### Status: Research Phase

Suno AI provides AI music generation. Integration requires further research.

### Known Information

| Attribute | Value |
|-----------|-------|
| **Website** | https://suno.ai |
| **API** | Not publicly documented |
| **Alternative** | May need partnership or waitlist |

### Research Tasks

- [ ] Investigate Suno API access
- [ ] Explore alternative music generation APIs
- [ ] Consider fallback to curated playlists
- [ ] Document pricing when available

### Alternative Music Sources

If Suno integration isn't feasible:

1. **Royalty-free streams**
   - Lofi Girl YouTube/API
   - Chillhop Music
   - College Music

2. **Self-hosted playlists**
   - Licensed tracks in S3
   - Rotate through curated selection

3. **Other AI options**
   - Mubert API
   - AIVA
   - Soundraw

---

## Lambda Implementation

### Project Structure

```
lambda_src/
├── src/
│   ├── index.ts              # Main router
│   ├── handlers/
│   │   ├── generate-image.ts # DALL-E handler
│   │   ├── generate-music.ts # Music handler
│   │   └── channels.ts       # Channel data
│   ├── services/
│   │   ├── openai.ts         # OpenAI client
│   │   ├── rate-limiter.ts   # Rate limiting
│   │   └── storage.ts        # S3 operations
│   └── utils/
│       ├── response.ts       # Response helpers
│       └── validation.ts     # Input validation
└── package.json
```

### Handler Pattern

```typescript
// handlers/generate-image.ts
import { APIGatewayProxyHandler } from 'aws-lambda';
import { generateWithDALLE } from '../services/openai';
import { checkRateLimit, incrementUsage } from '../services/rate-limiter';
import { verifyCaptcha } from '../services/captcha';
import { createResponse } from '../utils/response';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // 1. Parse request
    const body = JSON.parse(event.body || '{}');
    const { mood, style, captchaToken } = body;

    // 2. Validate input
    if (!mood || !captchaToken) {
      return createResponse(400, { error: 'Missing required fields' });
    }

    // 3. Verify CAPTCHA
    const captchaValid = await verifyCaptcha(captchaToken);
    if (!captchaValid) {
      return createResponse(403, { error: 'CAPTCHA verification failed' });
    }

    // 4. Check rate limit
    const userId = event.requestContext.identity?.sourceIp || 'unknown';
    const { allowed, remaining } = await checkRateLimit(userId, 'image');
    if (!allowed) {
      return createResponse(429, {
        error: 'Rate limit exceeded',
        retryAfter: 3600,
      });
    }

    // 5. Generate image
    const imageUrl = await generateWithDALLE(mood, style);

    // 6. Increment usage
    await incrementUsage(userId, 'image');

    // 7. Return success
    return createResponse(200, {
      success: true,
      imageUrl,
      remainingGenerations: remaining - 1,
    });

  } catch (error) {
    console.error('Generation error:', error);
    return createResponse(500, { error: 'Generation failed' });
  }
};
```

---

## Environment Variables

### Required Variables

| Variable | Description | Source |
|----------|-------------|--------|
| `OPENAI_API_KEY` | OpenAI API key | SSM Parameter Store |
| `GENERATIONS_TABLE` | DynamoDB table name | Terraform output |
| `RATE_LIMITS_TABLE` | Rate limits table | Terraform output |
| `ASSETS_BUCKET` | S3 bucket for assets | Terraform output |
| `CAPTCHA_SECRET` | CAPTCHA verification key | SSM Parameter Store |

### Local Development

Create `.env.local` for local testing (DO NOT COMMIT):

```bash
OPENAI_API_KEY=sk-...
GENERATIONS_TABLE=vibe-generations-dev
RATE_LIMITS_TABLE=vibe-rate-limits-dev
ASSETS_BUCKET=robmclaughl-in-assets-dev
CAPTCHA_SECRET=0x...
```

---

## Testing APIs

### Manual Testing

```bash
# Test DALL-E directly
curl https://api.openai.com/v1/images/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "dall-e-3",
    "prompt": "Lofi aesthetic room, cozy, warm lighting",
    "n": 1,
    "size": "1024x1024"
  }'
```

### Integration Testing

```typescript
// tests/integration/dalle.test.ts
describe('DALL-E Integration', () => {
  it('generates an image with valid prompt', async () => {
    const result = await generateWithDALLE('chill', 'cozy room');
    expect(result).toMatch(/^https:\/\//);
  });

  it('handles content policy violations', async () => {
    await expect(
      generateWithDALLE('inappropriate', 'banned content')
    ).rejects.toThrow('Content policy');
  });
});
```

---

## Monitoring

### CloudWatch Metrics

Track these metrics for API health:

- `dalle_requests_total` - Total generation requests
- `dalle_requests_success` - Successful generations
- `dalle_requests_failed` - Failed generations
- `dalle_latency_ms` - Generation latency
- `dalle_cost_usd` - Estimated cost

### Alerts

Set up CloudWatch alarms for:
- Error rate > 10%
- Daily cost > budget
- Rate limit hits > threshold
- Latency p99 > 30s

---

## Security Checklist

- [ ] API keys stored in SSM/Secrets Manager
- [ ] API keys never logged or exposed
- [ ] CORS properly configured
- [ ] Rate limiting active
- [ ] CAPTCHA verification enabled
- [ ] Input validation on all requests
- [ ] Error messages don't leak internals

---

## Related Documents

- [SECURITY.md](./SECURITY.md) - Security requirements
- [RESEARCH.md](./RESEARCH.md) - API research notes
- [VIBE_GENERATOR.md](./VIBE_GENERATOR.md) - Feature specification

---

*Last updated: January 2026*
