import type { IncomingMessage, ServerResponse } from 'http';

interface HealthResponse {
  status: 'ok' | 'degraded';
  timestamp: string;
  hasLtaKey: boolean;
  service: string;
  endpoints: {
    busArrival: string;
    health: string;
  };
}

/**
 * Health check serverless endpoint.
 * Works across Vercel serverless, Node.js HTTP/Express handlers, and Edge runtimes.
 */
export default async function handler(
  req: IncomingMessage & { query?: Record<string, string>; url?: string },
  res: ServerResponse
) {
  const ltaKey =
    process.env.LTA_ACCOUNT_KEY ||
    process.env.LTA_DATAMALL_KEY ||
    process.env.ACCOUNT_KEY ||
    '';

  const data: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasLtaKey: Boolean(ltaKey && ltaKey.trim().length > 0),
    service: 'lta-datamall-serverless-api',
    endpoints: {
      busArrival: '/api/busarrival?BusStopCode=83139',
      health: '/api/health',
    },
  };

  if (res && typeof res.setHeader === 'function') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.statusCode = 200;
    res.end(JSON.stringify(data, null, 2));
    return;
  }

  // Fallback for Web API standard Response
  return new Response(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// Web Fetch API / Next.js / Edge route export
export async function GET(request: Request) {
  const ltaKey =
    process.env.LTA_ACCOUNT_KEY ||
    process.env.LTA_DATAMALL_KEY ||
    process.env.ACCOUNT_KEY ||
    '';

  const data: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasLtaKey: Boolean(ltaKey && ltaKey.trim().length > 0),
    service: 'lta-datamall-serverless-api',
    endpoints: {
      busArrival: '/api/busarrival?BusStopCode=83139',
      health: '/api/health',
    },
  };

  return new Response(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
