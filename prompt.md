# Singapore LTA Bus Arrival & Real-Time Tracking Application

This document collates all project specifications, prompts, LTA DataMall v3 API schemas, architecture, and environment configurations for **SG Bus Radar**.

---

## 1. Project Overview & Prompts

### Core Prompts & Requirements
1. **Frontend Architecture**:
   - Build a Singapore-based bus arrival time application that tracks real-time bus locations and provides accurate wait time predictions for all LTA bus stops.
   - Front-end developed with React 19, TypeScript, Tailwind CSS, and Leaflet with a Google Maps-styled interface.

2. **Serverless API Connection (Root `/api` directory)**:
   - Serverless connection pulling live data from LTA DataMall using the official endpoints.
   - Stored in the project root `/api` folder:
     - `/api/health.ts`: Health check & API key status.
     - `/api/busarrival.ts`: Real-time Bus Arrival proxy for `v3/BusArrival`.
     - `/api/busstops.ts`: Bus stops retrieval proxy for `v3/BusStops`.
   - Dynamic key management (never hardcoded); reads from `LTA_ACCOUNT_KEY` environment variable or request headers.

3. **Google Map-Style Interface & Coordinate Alignment**:
   - Free Google Maps-like interface (Map street style, Satellite hybrid imagery, and Dark transit mode).
   - Precision alignment between LTA DataMall WGS84 coordinates (`Latitude`, `Longitude`) and Google Map Web Mercator projection.
   - Interactive controls: stacked zoom (`+`/`−`), geolocation ("Show My Location"), overview reset, and fullscreen toggle.

4. **100% Real API Data — Zero Simulation**:
   - All bus arrivals, wait times, vehicle locations, passenger loads, and deck types are obtained exclusively via live LTA DataMall API calls.
   - No mock data, no synthetic trajectory generators, and no hardcoded arrival timestamps.

---

## 2. LTA DataMall v3 API Specification

### 2.1 Bus Arrival Endpoint
- **URL**: `https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival`
- **Method**: `GET`
- **Update Frequency**: 20 seconds
- **Headers**:
  - `AccountKey`: `<LTA_ACCOUNT_KEY>`
  - `accept`: `application/json`

#### Request Parameters:
| Parameter | Description | Mandatory | Example |
| :--- | :--- | :--- | :--- |
| `BusStopCode` | Bus stop reference code | Yes | `83139` |
| `ServiceNo` | Bus service number | No | `15` |

#### Response Attributes:
| Attribute | Description | Example |
| :--- | :--- | :--- |
| `odata.metadata` | OData service metadata URL | `https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival` |
| `BusStopCode` | Queried bus stop code | `83139` |
| `Services` | Array of bus services serving the stop | `[...]` |
| `Services[].ServiceNo` | Bus service number | `15` |
| `Services[].Operator` | Operator code (`SBST`, `SMRT`, `TTS`, `GAS`) | `GAS` |
| `Services[].NextBus` | First oncoming bus details | `{...}` |
| `Services[].NextBus2` | Second oncoming bus details | `{...}` |
| `Services[].NextBus3` | Third oncoming bus details | `{...}` |

#### Bus-Level Attributes (`NextBus`, `NextBus2`, `NextBus3`):
| Field | Description | Type / Values | Example |
| :--- | :--- | :--- | :--- |
| `OriginCode` | Reference code of the first bus stop | string | `77009` |
| `DestinationCode` | Reference code of terminating bus stop | string | `77009` |
| `EstimatedArrival` | Date-time of arrival (GMT+8 / SST) | ISO 8601 string | `2024-08-14T16:41:48+08:00` |
| `Monitored` | Schedule vs. Live location tracking | `0` (schedule) or `1` (live GPS) | `1` |
| `Latitude` | Estimated location coordinates of vehicle | decimal string | `1.315491833333334` |
| `Longitude` | Estimated location coordinates of vehicle | decimal string | `103.9059125` |
| `VisitNumber` | Ordinal value of nth visit to this stop | string / number | `1` |
| `Load` | Passenger occupancy / crowding level | `SEA` (Seats Available), `SDA` (Standing Available), `LSD` (Limited Standing) | `SEA` |
| `Feature` | Wheelchair accessibility flag | `WAB` or empty | `WAB` |
| `Type` | Vehicle type | `SD` (Single Deck), `DD` (Double Deck), `BD` (Bendy) | `SD` |

### 2.2 Bus Stops Endpoint
- **URL**: `https://datamall2.mytransport.sg/ltaodataservice/v3/BusStops`
- **Method**: `GET`
- **Query Parameter**: `$skip` (0, 500, 1000...)
- **Headers**: `AccountKey: <LTA_ACCOUNT_KEY>`, `accept: application/json`

---

## 3. Sample API Call & Response

### Request:
```http
GET https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=83139 HTTP/1.1
Host: datamall2.mytransport.sg
AccountKey: <YOUR_LTA_ACCOUNT_KEY>
accept: application/json
```

### Response:
```json
{
  "odata.metadata": "https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival",
  "BusStopCode": "83139",
  "Services": [
    {
      "ServiceNo": "15",
      "Operator": "GAS",
      "NextBus": {
        "OriginCode": "77009",
        "DestinationCode": "77009",
        "EstimatedArrival": "2024-08-14T16:41:48+08:00",
        "Monitored": 1,
        "Latitude": "1.315491833333334",
        "Longitude": "103.9059125",
        "VisitNumber": "1",
        "Load": "SEA",
        "Feature": "WAB",
        "Type": "SD"
      },
      "NextBus2": {
        "OriginCode": "77009",
        "DestinationCode": "77009",
        "EstimatedArrival": "2024-08-14T16:49:22+08:00",
        "Monitored": 1,
        "Latitude": "1.330962166666667",
        "Longitude": "103.9034135",
        "VisitNumber": "1",
        "Load": "SEA",
        "Feature": "WAB",
        "Type": "SD"
      },
      "NextBus3": {
        "OriginCode": "77009",
        "DestinationCode": "77009",
        "EstimatedArrival": "2024-08-14T17:06:11+08:00",
        "Monitored": 1,
        "Latitude": "1.344761",
        "Longitude": "103.9402231666667",
        "VisitNumber": "1",
        "Load": "SEA",
        "Feature": "WAB",
        "Type": "SD"
      }
    }
  ]
}
```

---

## 4. Architecture & File Structure

```
├── /api
│   ├── busarrival.ts       # Serverless function: proxies LTA BusArrival v3
│   ├── busstops.ts         # Serverless function: proxies LTA BusStops v3
│   └── health.ts           # Serverless health check & API key status
├── /src
│   ├── components
│   │   ├── ArrivalBoard.tsx       # Live LTA arrivals, loads, deck types, countdowns
│   │   ├── BackendConfigModal.tsx # LTA DataMall AccountKey & connection testing
│   │   ├── BookmarksList.tsx      # Bookmarked commute bus stops
│   │   ├── BusMap.tsx             # Leaflet Google Map interface & real-time bus pins
│   │   ├── Header.tsx             # 3-Zone top navigation bar
│   │   ├── MobileTabBar.tsx       # Mobile thumb navigation
│   │   └── StopSearchModal.tsx    # BusStopCode and name search modal
│   ├── services
│   │   └── busService.ts          # Pure LTA API fetch client & countdown engine
│   ├── types
│   │   └── bus.ts                 # TypeScript types matching LTA v3 schema
│   ├── App.tsx                    # Root application component
│   ├── index.css                  # Tailwind styles and map styles
│   └── main.tsx                   # Entry point
├── .env.example                   # Environment variable template
├── index.html                     # HTML shell
├── package.json                   # Dependencies
├── prompt.md                      # This documentation file
├── tsconfig.json                  # TypeScript configuration
└── vite.config.ts                 # Vite setup with /api development proxy
```

---

## 5. Configuration & Environment Variables

Create a `.env` file in the project root:

```bash
# LTA DataMall AccountKey: Request from https://datamall.lta.gov.sg/
LTA_ACCOUNT_KEY="YOUR_LTA_ACCOUNT_KEY"

# Optional App URL
APP_URL="http://localhost:3000"
```

You can also input your LTA AccountKey directly inside the application UI via the **"Configure LTA Key"** button in the header.

---

## 6. Git Remote

- **Repository**: `https://github.com/cyudr/lta-bus-arrival.git`
- **Branch**: `main`
