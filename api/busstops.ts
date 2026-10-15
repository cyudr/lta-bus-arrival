import type { IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';

const LTA_BUS_STOPS_URL = 'https://datamall2.mytransport.sg/ltaodataservice/v3/BusStops';

/**
 * Serverless function to fetch official Singapore bus stops from LTA DataMall v3.
 *
 * Query Params:
 *  - $skip (number, optional, default 0, step by 500)
 *
 * Headers:
 *  - AccountKey: <LTA_ACCOUNT_KEY>
 *  - accept: application/json
 */
export default async function handler(
  req: IncomingMessage & { query?: Record<string, string>; url?: string },
  res: ServerResponse
) {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, AccountKey, Authorization');
    res.statusCode = 204;
    res.end();
    return;
  }

  const reqUrl = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
  const skip = reqUrl.searchParams.get('$skip') || req.query?.['$skip'] || '0';

  const ltaAccountKey =
    process.env.LTA_ACCOUNT_KEY ||
    process.env.LTA_DATAMALL_KEY ||
    process.env.ACCOUNT_KEY ||
    (req.headers['accountkey'] as string) ||
    '';

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');

  if (!ltaAccountKey || !ltaAccountKey.trim()) {
    res.statusCode = 503;
    res.end(
      JSON.stringify(
        {
          error: 'LTA_ACCOUNT_KEY_NOT_CONFIGURED',
          message:
            'LTA DataMall AccountKey is not set. Please set the LTA_ACCOUNT_KEY environment variable in your deployment or provide it in the API settings.',
          documentation: 'https://datamall.lta.gov.sg/content/datamall/en/request-api.html',
        },
        null,
        2
      )
    );
    return;
  }

  try {
    const targetUrl = new URL(LTA_BUS_STOPS_URL);
    if (skip && skip !== '0') {
      targetUrl.searchParams.set('$skip', skip.trim());
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
            message: `LTA DataMall BusStops returned HTTP ${response.status}`,
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
          message: err.message || 'Failed to connect to LTA DataMall BusStops endpoint',
        },
        null,
        2
      )
    );
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const skip = url.searchParams.get('$skip') || '0';

  const ltaAccountKey =
    process.env.LTA_ACCOUNT_KEY ||
    process.env.LTA_DATAMALL_KEY ||
    process.env.ACCOUNT_KEY ||
    request.headers.get('accountkey') ||
    '';

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=3600, s-maxage=3600',
  };

  if (!ltaAccountKey || !ltaAccountKey.trim()) {
    return new Response(
      JSON.stringify({
        error: 'LTA_ACCOUNT_KEY_NOT_CONFIGURED',
        message: 'LTA DataMall AccountKey is not set. Please set LTA_ACCOUNT_KEY environment variable.',
      }),
      { status: 503, headers: defaultHeaders }
    );
  }

  try {
    const targetUrl = new URL(LTA_BUS_STOPS_URL);
    if (skip && skip !== '0') {
      targetUrl.searchParams.set('$skip', skip.trim());
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
          message: `LTA DataMall BusStops returned HTTP ${response.status}`,
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
        message: err.message || 'Failed to connect to LTA DataMall BusStops endpoint',
      }),
      { status: 500, headers: defaultHeaders }
    );
  }
}
