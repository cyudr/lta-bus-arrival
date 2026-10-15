import type { IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';

const LTA_BASE_URL = 'https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival';

/**
 * Serverless function to fetch real-time Singapore bus arrivals from LTA DataMall v3.
 *
 * Query Params:
 *  - BusStopCode (string, e.g. "83139" or "09048") - required
 *  - ServiceNo (string, optional, e.g. "15" or "190") - optional filter
 *
 * Headers required by LTA DataMall:
 *  - AccountKey: <LTA_ACCOUNT_KEY> (read from environment variable, never hardcoded)
 *  - accept: application/json
 */
export default async function handler(
  req: IncomingMessage & { query?: Record<string, string>; url?: string },
  res: ServerResponse
) {
  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, AccountKey, Authorization');
    res.statusCode = 204;
    res.end();
    return;
  }

  // Parse query parameters from request URL
  const reqUrl = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
  const busStopCode =
    reqUrl.searchParams.get('BusStopCode') ||
    req.query?.BusStopCode ||
    '';
  const serviceNo =
    reqUrl.searchParams.get('ServiceNo') ||
    req.query?.ServiceNo ||
    '';

  // Read LTA Account Key from environment variable or incoming header (never hardcoded)
  const ltaAccountKey =
    process.env.LTA_ACCOUNT_KEY ||
    process.env.LTA_DATAMALL_KEY ||
    process.env.ACCOUNT_KEY ||
    (req.headers['accountkey'] as string) ||
    '';

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, max-age=10, s-maxage=10, stale-while-revalidate=20');

  // Validate bus stop code
  if (!busStopCode) {
    res.statusCode = 400;
    res.end(
      JSON.stringify(
        {
          error: 'MISSING_BUS_STOP_CODE',
          message: 'Query parameter "BusStopCode" is required. Example: /api/busarrival?BusStopCode=83139',
        },
        null,
        2
      )
    );
    return;
  }

  // Check if API key is configured
  if (!ltaAccountKey || !ltaAccountKey.trim()) {
    res.statusCode = 503;
    res.end(
      JSON.stringify(
        {
          error: 'LTA_ACCOUNT_KEY_NOT_CONFIGURED',
          message:
            'LTA DataMall AccountKey is not set. Please set the LTA_ACCOUNT_KEY environment variable in your deployment or .env file.',
          busStopCode,
          documentation: 'https://datamall.lta.gov.sg/content/datamall/en/request-api.html',
        },
        null,
        2
      )
    );
    return;
  }

  try {
    // Construct LTA DataMall v3 URL
    const targetUrl = new URL(LTA_BASE_URL);
    targetUrl.searchParams.set('BusStopCode', busStopCode.trim());
    if (serviceNo && serviceNo.trim()) {
      targetUrl.searchParams.set('ServiceNo', serviceNo.trim());
    }

    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        AccountKey: ltaAccountKey.trim(),
        accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      res.statusCode = response.status;
      res.end(
        JSON.stringify(
          {
            error: 'LTA_DATAMALL_UPSTREAM_ERROR',
            status: response.status,
            message: `LTA DataMall returned HTTP ${response.status}`,
            details: errorText,
          },
          null,
          2
        )
      );
      return;
    }

    const data = await response.json();
    res.statusCode = 200;
    res.end(JSON.stringify(data));
  } catch (err: any) {
    res.statusCode = 500;
    res.end(
      JSON.stringify(
        {
          error: 'FETCH_FAILED',
          message: err.message || 'Failed to connect to LTA DataMall v3 service',
        },
        null,
        2
      )
    );
  }
}

/**
 * Web standard Fetch / Edge handler (for Vercel Edge, Next.js route, Cloudflare)
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const busStopCode = url.searchParams.get('BusStopCode') || '';
  const serviceNo = url.searchParams.get('ServiceNo') || '';

  const ltaAccountKey =
    process.env.LTA_ACCOUNT_KEY ||
    process.env.LTA_DATAMALL_KEY ||
    process.env.ACCOUNT_KEY ||
    request.headers.get('accountkey') ||
    '';

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=10, s-maxage=10, stale-while-revalidate=20',
  };

  if (!busStopCode) {
    return new Response(
      JSON.stringify({
        error: 'MISSING_BUS_STOP_CODE',
        message: 'Query parameter "BusStopCode" is required. Example: /api/busarrival?BusStopCode=83139',
      }),
      { status: 400, headers: defaultHeaders }
    );
  }

  if (!ltaAccountKey || !ltaAccountKey.trim()) {
    return new Response(
      JSON.stringify({
        error: 'LTA_ACCOUNT_KEY_NOT_CONFIGURED',
        message:
          'LTA DataMall AccountKey is not set. Please set the LTA_ACCOUNT_KEY environment variable in your deployment or .env file.',
        busStopCode,
        documentation: 'https://datamall.lta.gov.sg/content/datamall/en/request-api.html',
      }),
      { status: 503, headers: defaultHeaders }
    );
  }

  try {
    const targetUrl = new URL(LTA_BASE_URL);
    targetUrl.searchParams.set('BusStopCode', busStopCode.trim());
    if (serviceNo && serviceNo.trim()) {
      targetUrl.searchParams.set('ServiceNo', serviceNo.trim());
    }

    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        AccountKey: ltaAccountKey.trim(),
        accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({
          error: 'LTA_DATAMALL_UPSTREAM_ERROR',
          status: response.status,
          message: `LTA DataMall returned HTTP ${response.status}`,
          details: errorText,
        }),
        { status: response.status, headers: defaultHeaders }
      );
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), { status: 200, headers: defaultHeaders });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: 'FETCH_FAILED',
        message: err.message || 'Failed to connect to LTA DataMall v3 service',
      }),
      { status: 500, headers: defaultHeaders }
    );
  }
}
