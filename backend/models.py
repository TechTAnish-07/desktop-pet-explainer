from pydantic import BaseModel, Field
from typing import Optional

class ExplainRequest(BaseModel):
    text: str = Field(..., description="The copied text to be explained using the powerful explanation model")
    model: Optional[str] = Field(None, description="Powerful explanation model identifier (e.g., gemini/gemini-2.5-pro, gemini/gemini-2.5-flash)")
    api_key: Optional[str] = Field(None, description="Optional API key override sent from frontend secure store")
    context: Optional[str] = Field(None, description="Optional surrounding context")

class ChatRequest(BaseModel):
    message: str = Field(..., description="User chat message or follow-up question")
    model: Optional[str] = Field(None, description="Lightweight friendly conversation model identifier (e.g., gemini/gemini-2.5-flash-lite)")
    api_key: Optional[str] = Field(None, description="Optional API key override")

class ProviderInfo(BaseModel):
    name: str
    default_explain_model: str
    default_chat_model: str
    available_models: list[str]
