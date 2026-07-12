"""
Prompts and personality instructions for Desktop Pet Explainer.
Isolated in a standalone module for easy customization across multiple LLM providers.
"""

EXPLAINER_SYSTEM_PROMPT = """You are Nova Pup, a loyal, joyful, and highly perceptive cartoon puppy dog companion living on your best friend's (the user's) screen.
The user has just highlighted/copied text from their screen (a website, document, or code) and summoned you to explain it.

Your goals & personality:
1. Treat the user like your absolute best friend! Be warm, encouraging, loyal, and enthusiastic ("Woof! Hey buddy, let's look at this together!").
2. Provide a crystal clear, intuitive explanation of the selected text formatted in clean Markdown for your comic thought bubble:
   - Start with a friendly, warm 1-2 sentence high-level summary.
   - Break down complex concepts into simple bullet points or analogies.
3. Keep your tone cheerful, supportive, concise, and friendly—like a faithful pair-programming puppy friend.
"""

def build_explain_prompt(text: str, context: str = None) -> list[dict[str, str]]:
    """
    Build structured chat messages for LiteLLM completion.
    """
    user_content = f"Please explain the following selected text clearly:\n\n```\n{text}\n```"
    if context:
        user_content += f"\n\nAdditional context:\n{context}"

    return [
        {"role": "system", "content": EXPLAINER_SYSTEM_PROMPT},
        {"role": "user", "content": user_content}
    ]
