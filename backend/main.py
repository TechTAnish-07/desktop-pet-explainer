import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from models import ExplainRequest, ChatRequest
from explainer import stream_explanation, stream_chat
from memory import get_user_memories, clear_user_memories

# Load environment variables from .env
load_dotenv()

app = FastAPI(
    title="Desktop Pet Explainer API",
    description="Local sidecar backend for dual-model explanations & friendly conversation via LiteLLM",
    version="1.0.0"
)

# Configure CORS for Electron local renderer requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "default_explain_model": os.getenv("DEFAULT_EXPLAIN_MODEL", "gemini/gemini-2.5-pro"),
        "default_chat_model": os.getenv("DEFAULT_CHAT_MODEL", "gemini/gemini-2.5-flash-lite")
    }

@app.get("/providers")
async def get_providers():
    """Returns supported model prefixes and default configuration."""
    return {
        "default_explain_model": os.getenv("DEFAULT_EXPLAIN_MODEL", "gemini/gemini-2.5-pro"),
        "default_chat_model": os.getenv("DEFAULT_CHAT_MODEL", "gemini/gemini-2.5-flash-lite"),
        "explain_models": [
            {"id": "gemini/gemini-2.5-pro", "name": "Google Gemini 2.5 Pro (Powerful Explanation)", "provider": "Google"},
            {"id": "gemini/gemini-2.5-flash", "name": "Google Gemini 2.5 Flash", "provider": "Google"},
            {"id": "claude-3-5-sonnet-latest", "name": "Anthropic Claude 3.5 Sonnet", "provider": "Anthropic"},
            {"id": "gpt-4o", "name": "OpenAI GPT-4o", "provider": "OpenAI"},
            {"id": "mock", "name": "Simulation Dev Mode (No API Key)", "provider": "Local"}
        ],
        "chat_models": [
            {"id": "gemini/gemini-2.5-flash-lite", "name": "Google Gemini 2.5 Flash-Lite (Fast Friendly Chat)", "provider": "Google"},
            {"id": "gpt-4o-mini", "name": "OpenAI GPT-4o-Mini", "provider": "OpenAI"},
            {"id": "mock", "name": "Simulation Dev Mode (No API Key)", "provider": "Local"}
        ]
    }

@app.post("/explain")
async def explain_text(request: ExplainRequest):
    """
    POST endpoint that streams powerful explanations using Server-Sent Events (SSE).
    """
    return StreamingResponse(
        stream_explanation(
            text=request.text,
            model=request.model,
            api_key=request.api_key,
            context=request.context
        ),
        media_type="text/event-stream"
    )

@app.post("/chat")
async def chat_friendly(request: ChatRequest):
    """
    POST endpoint that streams fast friendly conversation using lightweight model.
    """
    return StreamingResponse(
        stream_chat(
            message=request.message,
            model=request.model,
            api_key=request.api_key
        ),
        media_type="text/event-stream"
    )

@app.get("/memories")
async def get_memories():
    """Retrieve stored personal facts about the user."""
    return {"memories": get_user_memories()}

@app.delete("/memories")
async def delete_memories():
    """Clear all stored personal facts about the user."""
    return {"cleared": clear_user_memories()}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "127.0.0.1")
    uvicorn.run("main:app", host=host, port=port, reload=False)
