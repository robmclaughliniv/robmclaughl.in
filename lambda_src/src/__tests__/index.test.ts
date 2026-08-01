import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

// Mock DynamoDB before importing handler
const mockSend = vi.fn();
vi.mock('@aws-sdk/client-dynamodb', () => {
  return {
    DynamoDBClient: class { },
  };
});
vi.mock('@aws-sdk/lib-dynamodb', () => {
  return {
    DynamoDBDocumentClient: {
      from: () => ({ send: mockSend }),
    },
    PutCommand: class {
      constructor(public input: unknown) {}
    },
  };
});

const { handler } = await import('../index') as {
  handler: (event: APIGatewayProxyEvent, context: never, callback: () => void) => Promise<APIGatewayProxyResult>;
};

function makeEvent(overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent {
  return {
    body: null,
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'POST',
    isBase64Encoded: false,
    path: '/',
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as APIGatewayProxyEvent['requestContext'],
    resource: '',
    ...overrides,
  };
}

describe('Lambda handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DYNAMODB_TABLE_NAME = 'test-table';
  });

  it('returns 500 when DYNAMODB_TABLE_NAME is not set', async () => {
    delete process.env.DYNAMODB_TABLE_NAME;
    const result = await handler(makeEvent({ body: '{"name":"a","message":"b"}' }), {} as never, () => {});
    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).error).toMatch(/Configuration missing/);
  });

  it('returns 400 when body is missing', async () => {
    const result = await handler(makeEvent(), {} as never, () => {});
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toBe('Request body is required.');
  });

  it('returns 400 for invalid JSON', async () => {
    const result = await handler(makeEvent({ body: 'not-json' }), {} as never, () => {});
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toMatch(/Invalid JSON/);
  });

  it('returns 400 when name is missing', async () => {
    const result = await handler(makeEvent({ body: '{"message":"hi"}' }), {} as never, () => {});
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toMatch(/name/);
  });

  it('returns 400 when message is missing', async () => {
    const result = await handler(makeEvent({ body: '{"name":"Rob"}' }), {} as never, () => {});
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toMatch(/message/);
  });

  it('returns 400 when name is empty string', async () => {
    const result = await handler(makeEvent({ body: '{"name":"  ","message":"hi"}' }), {} as never, () => {});
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toMatch(/name/);
  });

  it('returns 201 on successful creation', async () => {
    mockSend.mockResolvedValueOnce({});
    const result = await handler(
      makeEvent({ body: '{"name":"Rob","message":"Hello"}' }),
      {} as never,
      () => {},
    );
    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body);
    expect(body.message).toBe('Record successfully created.');
    expect(body.id).toBeDefined();
  });

  it('returns 500 when DynamoDB write fails', async () => {
    mockSend.mockRejectedValueOnce(new Error('DynamoDB error'));
    const result = await handler(
      makeEvent({ body: '{"name":"Rob","message":"Hello"}' }),
      {} as never,
      () => {},
    );
    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).error).toMatch(/DynamoDB error/);
  });

  it('includes CORS headers in response', async () => {
    mockSend.mockResolvedValueOnce({});
    const result = await handler(
      makeEvent({ body: '{"name":"Rob","message":"Hello"}' }),
      {} as never,
      () => {},
    );
    expect(result.headers?.['Access-Control-Allow-Origin']).toBe('*');
    expect(result.headers?.['Content-Type']).toBe('application/json');
  });
});
