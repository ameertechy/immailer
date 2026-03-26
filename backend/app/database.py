import os
import asyncpg
from typing import Optional

DATABASE_URL = os.environ.get("DATABASE_URL", "")

async def get_conn():
    return await asyncpg.connect(DATABASE_URL)

async def log_open_event(
    token: str, ip: str, user_agent: str,
    country: str, region: str, city: str,
    isp: str, opened_at: str
):
    conn = await get_conn()
    try:
        await conn.execute("""
            INSERT INTO open_events
                (token, ip, user_agent, country, region, city, isp, opened_at)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        """, token, ip, user_agent, country, region, city, isp, opened_at)
    finally:
        await conn.close()

async def get_events_by_token(token: str):
    conn = await get_conn()
    try:
        rows = await conn.fetch("""
            SELECT * FROM open_events
            WHERE token = $1
            ORDER BY opened_at DESC
        """, token)
        return [dict(r) for r in rows]
    finally:
        await conn.close()

async def get_all_events():
    conn = await get_conn()
    try:
        rows = await conn.fetch("""
            SELECT * FROM open_events
            ORDER BY opened_at DESC
            LIMIT 500
        """)
        return [dict(r) for r in rows]
    finally:
        await conn.close()
