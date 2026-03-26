from fastapi import FastAPI, Request, Header
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import os, base64, httpx, uuid
from app.database import log_open_event, get_events_by_token, get_all_events

app = FastAPI(title="Immailer Tracker")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# 1x1 transparent GIF
PIXEL = base64.b64decode(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
)

@app.get("/px/{token}")
async def tracking_pixel(
    token: str,
    request: Request,
    user_agent: str = Header(default="unknown")
):
    ip = request.headers.get("x-forwarded-for", request.client.host)
    # Strip multiple IPs (proxies), take first
    ip = ip.split(",")[0].strip()

    # Geo lookup (free, no key needed)
    geo = {}
    try:
        async with httpx.AsyncClient(timeout=3) as client:
            r = await client.get(f"http://ip-api.com/json/{ip}?fields=country,regionName,city,isp")
            if r.status_code == 200:
                geo = r.json()
    except Exception:
        pass

    await log_open_event(
        token=token,
        ip=ip,
        user_agent=user_agent,
        country=geo.get("country", ""),
        region=geo.get("regionName", ""),
        city=geo.get("city", ""),
        isp=geo.get("isp", ""),
        opened_at=datetime.utcnow().isoformat()
    )

    return Response(
        content=PIXEL,
        media_type="image/gif",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
        }
    )

@app.get("/events/{token}")
async def get_events(token: str, api_key: str = Header(default="")):
    if api_key != os.environ.get("API_KEY", "changeme"):
        return Response(status_code=401)
    events = await get_events_by_token(token)
    return {"token": token, "opens": events}

@app.get("/events")
async def all_events(api_key: str = Header(default="")):
    if api_key != os.environ.get("API_KEY", "changeme"):
        return Response(status_code=401)
    events = await get_all_events()
    return {"events": events}

@app.get("/health")
async def health():
    return {"status": "ok", "time": datetime.utcnow().isoformat()}
