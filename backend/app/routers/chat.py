from fastapi import APIRouter, HTTPException, status
from ..schemas.chat import ChatResponse, ChatRequest
from ..services.llm_client import LLMClient, SYSTEM_PROMPTS

router = APIRouter(prefix="/chat", tags=["AI Assistant"])


@router.post("", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    if not request.messages:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, detail="Messages cannot be empty."
        )

    mode_prompt = SYSTEM_PROMPTS.get(request.mode, SYSTEM_PROMPTS["default"])
    client = LLMClient()
    reply = client.generate_response(
        [{"role": msg.role, "content": msg.content} for msg in request.messages],
        mode_prompt,
    )
    return ChatResponse(reply=reply)
