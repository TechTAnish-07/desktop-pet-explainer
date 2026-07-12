import json
import os
from pathlib import Path

# Local storage path inside user's home directory so it's safe and private
MEMORY_DIR = Path.home() / ".desktop-pet-explainer"
MEMORY_FILE = MEMORY_DIR / "user_memory.json"

def _ensure_memory_file():
    MEMORY_DIR.mkdir(parents=True, exist_ok=True)
    if not MEMORY_FILE.exists():
        with open(MEMORY_FILE, "w", encoding="utf-8") as f:
            json.dump({"memories": []}, f, indent=2)

def get_user_memories() -> list[str]:
    """Retrieve all stored friendly memories about the user."""
    try:
        _ensure_memory_file()
        with open(MEMORY_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("memories", [])
    except Exception:
        return []

def add_user_memory(fact: str) -> list[str]:
    """Add a new personal fact/memory about the user to local storage."""
    fact = fact.strip()
    if not fact:
        return get_user_memories()

    memories = get_user_memories()
    if fact not in memories:
        memories.append(fact)
        # Keep up to 50 most recent facts
        memories = memories[-50:]
        try:
            _ensure_memory_file()
            with open(MEMORY_FILE, "w", encoding="utf-8") as f:
                json.dump({"memories": memories}, f, indent=2)
        except Exception as e:
            print(f"[Memory] Error saving memory: {e}")
    return memories

def clear_user_memories() -> bool:
    """Clear all stored memories about the user."""
    try:
        _ensure_memory_file()
        with open(MEMORY_FILE, "w", encoding="utf-8") as f:
            json.dump({"memories": []}, f, indent=2)
        return True
    except Exception:
        return False

def extract_and_store_memory_heuristic(message: str) -> str | None:
    """
    Lightweight local heuristic extraction to quickly capture personal facts
    introduced during friendly chat without extra latency.
    """
    msg_lower = message.lower().strip()
    triggers = [
        ("my name is ", "User's name is "),
        ("i am called ", "User's name is "),
        ("i love ", "User loves "),
        ("i like ", "User likes "),
        ("i am working on ", "User is working on "),
        ("my favorite ", "User's favorite "),
        ("i'm building ", "User is building "),
        ("i am building ", "User is building "),
    ]
    for prefix, fact_prefix in triggers:
        if prefix in msg_lower:
            idx = msg_lower.find(prefix) + len(prefix)
            raw_val = message[idx:].split(".")[0].split("!")[0].strip()
            if len(raw_val) > 1 and len(raw_val) < 60:
                fact = f"{fact_prefix}{raw_val}"
                add_user_memory(fact)
                return fact
    return None
