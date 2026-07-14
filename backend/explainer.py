import asyncio
import os
import json
from typing import AsyncGenerator
import litellm
from prompts import build_explain_prompt, build_chat_prompt
from memory import get_user_memories, extract_and_store_memory_heuristic

# Suppress LiteLLM verbose logging by default
litellm.suppress_debug_info = True

async def stream_explanation(
    text: str,
    model: str | None = None,
    api_key: str | None = None,
    context: str | None = None,
    history: list[dict[str, str]] | None = None
) -> AsyncGenerator[str, None]:
    """
    Streams markdown explanation chunks using Server-Sent Events (SSE) format with Powerful Model.
    Yields data formatted as SSE lines: 'data: {"chunk": "..."}\n\n'
    Finished event: 'data: [DONE]\n\n'
    """
    selected_model = model or os.getenv("DEFAULT_EXPLAIN_MODEL", "gemini/gemini-2.5-flash")

    # If mock model or explicitly requested mock
    if selected_model.lower() == "mock":
        async for chunk in _stream_mock_explanation(text):
            yield chunk
        return

    kwargs = {
        "model": selected_model,
        "messages": build_explain_prompt(text, context, history),
        "stream": True,
    }
    if api_key:
        kwargs["api_key"] = api_key

    try:
        response = await litellm.acompletion(**kwargs)
        async for part in response:
            delta = part.choices[0].delta.content if part.choices and part.choices[0].delta else None
            if delta:
                payload = json.dumps({"chunk": delta})
                yield f"data: {payload}\n\n"
        yield "data: [DONE]\n\n"
    except Exception as e:
        err_msg = f"\n\n**Note:** *Could not reach LLM provider (`{selected_model}`): {str(e)}*\n\nSwitching to local simulation explanation:\n\n"
        yield f"data: {json.dumps({'chunk': err_msg})}\n\n"
        async for chunk in _stream_mock_explanation(text):
            yield chunk

async def stream_chat(
    message: str,
    model: str | None = None,
    api_key: str | None = None,
    history: list[dict[str, str]] | None = None
) -> AsyncGenerator[str, None]:
    """
    Streams friendly chit-chat using Lightweight Conversation Model (e.g., gemini-2.5-flash-lite)
    and safe local user memory.
    """
    selected_model = model or os.getenv("DEFAULT_CHAT_MODEL", "gemini/gemini-2.5-flash-lite")

    # Automatically extract any personal fact from user message to local memory
    extract_and_store_memory_heuristic(message)
    memories = get_user_memories()

    if selected_model.lower() == "mock":
        async for chunk in _stream_mock_chat(message):
            yield chunk
        return

    kwargs = {
        "model": selected_model,
        "messages": build_chat_prompt(message, memories, history),
        "stream": True,
    }
    if api_key:
        kwargs["api_key"] = api_key

    try:
        response = await litellm.acompletion(**kwargs)
        async for part in response:
            delta = part.choices[0].delta.content if part.choices and part.choices[0].delta else None
            if delta:
                payload = json.dumps({"chunk": delta})
                yield f"data: {payload}\n\n"
        yield "data: [DONE]\n\n"
    except Exception as e:
        async for chunk in _stream_mock_chat(message):
            yield chunk

async def _stream_mock_chat(message: str) -> AsyncGenerator[str, None]:
    msg_lower = message.lower()
    if any(w in msg_lower for w in ["hello", "hi", "hey", "woof", "morning", "howdy"]):
        reply = "Woof woof! 🐾 Hey there, bestie! I'm so happy to hang out with you today! What are we working on right now? Tell me everything!"
    elif any(w in msg_lower for w in ["help", "how", "what", "why", "error", "bug", "python", "code", "js", "react"]):
        reply = f"Let's tackle that together, buddy! 🧠 When looking at `{message[:35]}...`, the best way to solve it is by breaking it down step-by-step. Feel free to highlight any code on your screen and press `Cmd+Shift+E` for a deep explanation!"
    elif any(w in msg_lower for w in ["thank", "thanks", "good boy", "love", "awesome", "great"]):
        reply = "Aww, woof! 🐶 You are the absolute best friend ever! I'm always right here on your screen whenever you need a hand or a cheerful tail wag!"
    else:
        reply = f"That is super interesting, my friend! 🐾 I'm loving our chat. Let's keep making progress on your goals today—you've got this!"

    for word in reply.split(' '):
        yield f"data: {json.dumps({'chunk': word + ' '})}\n\n"
        await asyncio.sleep(0.03)
    yield "data: [DONE]\n\n"


async def _stream_mock_explanation(text: str) -> AsyncGenerator[str, None]:
    """
    High-quality simulated streaming explanation for offline testing & dev mode.
    """
    preview = text.strip()
    if len(preview) > 60:
        preview = preview[:57] + "..."

    explanation_paragraphs = [
        f"**Here is a quick explanation of what you selected:**\n\n",
        f"> *\"{preview}\"*\n\n",
        "### Key Concept Breakdown\n\n",
        "- **Core Meaning**: This text refers to a key concept or pattern within your current document or codebase.\n",
        "- **Why it matters**: Understanding this helps clarify the surrounding context and logic flow.\n",
        "- **In practice**: When encountering this pattern, look at its inputs, dependencies, and expected output behavior.\n\n",
        "💡 *Tip: You can change the AI provider (`gemini/gemini-2.5-flash`, `claude-3-5-sonnet-latest`, etc.) anytime in the Pet Settings panel!*"
    ]

    for paragraph in explanation_paragraphs:
        # Stream word by word for a natural thought-bubble typing effect
        words = paragraph.split(" ")
        for i, word in enumerate(words):
            token = word + (" " if i < len(words) - 1 else "")
            payload = json.dumps({"chunk": token})
            yield f"data: {payload}\n\n"
            await asyncio.sleep(0.04)

    yield "data: [DONE]\n\n"
