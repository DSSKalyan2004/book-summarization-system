"""
local_store.py
───────────────
Persistent JSON file storage used as the fallback when MongoDB is unavailable.
All user accounts and summaries written here survive server restarts.
Files are stored in  server/data/  (auto-created).
"""

import json
import os
from pathlib import Path
from datetime import datetime

# ── Storage directory ──────────────────────────────────────────
DATA_DIR = Path(__file__).parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)

USERS_FILE        = DATA_DIR / "users.json"
HISTORY_FILE      = DATA_DIR / "history.json"
LOGIN_EVENTS_FILE = DATA_DIR / "login_events.json"   # every login ever — never deleted


# ─── Generic helpers ──────────────────────────────────────────

def _load(path: Path) -> list:
    """Load a JSON list from disk; return [] if file missing or corrupt."""
    try:
        if path.exists():
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        print(f"⚠️  local_store: could not load {path.name}: {e}")
    return []


def _save(path: Path, data: list) -> None:
    """Atomically write a JSON list to disk."""
    try:
        tmp = path.with_suffix(".tmp")
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2, default=str)
        tmp.replace(path)
    except Exception as e:
        print(f"⚠️  local_store: could not save {path.name}: {e}")


# ─── Users ────────────────────────────────────────────────────

def load_users() -> list:
    return _load(USERS_FILE)


def save_users(users: list) -> None:
    _save(USERS_FILE, users)


def add_user(user: dict) -> None:
    users = load_users()
    users.append(user)
    save_users(users)


def update_user(user_id: str, update: dict) -> None:
    users = load_users()
    for u in users:
        if u.get("id") == user_id or u.get("_id") == user_id:
            u.update(update)
            break
    save_users(users)


# ─── History (summaries) ──────────────────────────────────────

def load_history() -> list:
    return _load(HISTORY_FILE)


def save_history(items: list) -> None:
    _save(HISTORY_FILE, items)


def add_history_item(item: dict) -> None:
    items = load_history()
    items.insert(0, item)   # newest first
    save_history(items)


def delete_history_item(item_id: str, user_id: str) -> None:
    items = load_history()
    items = [i for i in items
             if not (i.get("id") == item_id and i.get("userId") == user_id)]
    save_history(items)


def get_user_history(user_id: str) -> list:
    return [i for i in load_history() if i.get("userId") == user_id]


# ─── Login Events (permanent, append-only) ────────────────────
# Every successful login is recorded here — data is NEVER deleted.

def load_login_events() -> list:
    return _load(LOGIN_EVENTS_FILE)


def record_login_event(event: dict) -> None:
    """Append a login event. event should contain: userId, email, name, role, timestamp"""
    events = load_login_events()
    events.insert(0, event)   # newest first
    _save(LOGIN_EVENTS_FILE, events)


def get_all_login_events() -> list:
    return load_login_events()
