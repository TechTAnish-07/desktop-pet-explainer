from pydantic import BaseModel, Field
from typing import Optional

class ExplainRequest(BaseModel):
    text: str = Field(..., description="The copied text to be explained")
    model: Optional[str] = Field(None, description="Model identifier override (e.g., gemini/gemini-2.5-flash, claude-3-5-sonnet-20241022)")
    api_key: Optional[str] = Field(None, description="Optional API key override sent from frontend secure store")
    context: Optional[str] = Field(None, description="Optional surrounding context")

class ProviderInfo(BaseModel):
    name: str
    default_model: str
    available_models: list[str]
