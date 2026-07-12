import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from models import ExplainRequest
from explainer import stream_explanation

# Load environment variables from .env
load_dotenv()

app = FastAPI(
    title="Desktop Pet Explainer API",
    description="Local sidecar backend for streaming explanations via LiteLLM",
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
        "default_model": os.getenv("DEFAULT_MODEL", "gemini/gemini-2.5-flash")
    }

@app.get("/providers")
async def get_providers():
    """Returns supported model prefixes and default configuration."""
    return {
        "default_model": os.getenv("DEFAULT_MODEL", "gemini/gemini-2.5-flash"),
        "models": [
            {"id": "gemini/gemini-2.5-flash", "name": "Google Gemini 2.5 Flash (Free Tier)", "provider": "Google"},
            {"id": "gemini/gemini-1.5-pro", "name": "Google Gemini 1.5 Pro", "provider": "Google"},
            {"id": "claude-3-5-sonnet-latest", "name": "Anthropic Claude 3.5 Sonnet", "provider": "Anthropic"},
            {"id": "gpt-4o", "name": "OpenAI GPT-4o", "provider": "OpenAI"},
            {"id": "mock", "name": "Simulation Dev Mode (No API Key)", "provider": "Local"}
        ]
    }

@app.post("/explain")
async def explain_text(request: ExplainRequest):
    """
    POST endpoint that streams explanations using Server-Sent Events (SSE).
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

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "127.0.0.1")
    uvicorn.run("main:app", host=host, port=port, reload=False)
