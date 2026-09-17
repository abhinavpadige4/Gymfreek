# Gymfreek-ai: FastAPI companion to the Next.js frontend (spec Phase 6).
# Structured JSON only - raw video never leaves the browser, so this service
# never sees a camera frame. Split to its own repo (Gymfreek-ai) on push.
#
# Env (server-side only, never in a client bundle):
#   AI_SERVICE_TOKEN   bearer token the Next.js app sends (empty = no auth, dev only)
#   OPENROUTER_API_KEY primary LLM key
#   OPENROUTER_MODEL   default: nvidia/nemotron-3-super-120b-a12b:free
#   GROQ_API_KEY       fallback LLM key
#   GROQ_MODEL         default: openai/gpt-oss-120b
# Run: uvicorn main:app --port 8000  (from this dir)

import json
import os

import httpx
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

OPENROUTER_MODEL = os.environ.get(
    "OPENROUTER_MODEL", "nvidia/nemotron-3-super-120b-a12b:free"
)
GROQ_MODEL = os.environ.get("GROQ_MODEL", "openai/gpt-oss-120b")
SERVICE_TOKEN = os.environ.get("AI_SERVICE_TOKEN", "")

app = FastAPI(title="Gymfreek-ai")


def check_auth(authorization: str | None) -> None:
    if SERVICE_TOKEN and authorization != f"Bearer {SERVICE_TOKEN}":
        raise HTTPException(status_code=401, detail="Unauthorized")


# --- Contracts (mirror lib/ai-service.ts) ---


class WorkoutSummary(BaseModel):
    exercise: str = Field(min_length=1, max_length=80)
    totalReps: int = Field(ge=0, le=100000)
    goodReps: int = Field(ge=0, le=100000)
    badReps: int = Field(ge=0, le=100000)
    averageScore: float = Field(ge=0, le=100)
    issues: dict[str, int] = {}
    duration: int = Field(default=0, ge=0, le=86400)


class CoachOutput(BaseModel):
    summary: str
    strengths: list[str] = []
    improvements: list[str] = []
    nextWorkoutAdvice: str = ""
    voiceMessage: str = ""


class ChatRequest(BaseModel):
    system: str
    messages: list[dict[str, str]] = []
    maxTokens: int = 8000


class ChatResponse(BaseModel):
    text: str
    modelUsed: str


class VoiceRequest(BaseModel):
    text: str = Field(min_length=1, max_length=2000)


# Static exercise metadata. Only squat has a full analyzer (client-side);
# anything else is 404 until its plugin module lands.
EXERCISES = {
    "squat": {
        "id": "squat",
        "cues": [
            "Keep your chest upright.",
            "Keep your knees aligned.",
            "Go a little deeper.",
        ],
    },
}


# --- LLM: OpenRouter primary, Groq fallback (server-side keys only) ---


async def complete(system: str, messages: list[dict], max_tokens: int) -> ChatResponse:
    payloads = []
    if os.environ.get("OPENROUTER_API_KEY"):
        payloads.append(
            (
                "https://openrouter.ai/api/v1/chat/completions",
                {"Authorization": f"Bearer {os.environ['OPENROUTER_API_KEY']}"},
                {"model": OPENROUTER_MODEL, "messages": [{"role": "system", "content": system}, *messages], "max_tokens": max_tokens},
            )
        )
    if os.environ.get("GROQ_API_KEY"):
        payloads.append(
            (
                "https://api.groq.com/openai/v1/chat/completions",
                {"Authorization": f"Bearer {os.environ['GROQ_API_KEY']}"},
                {"model": GROQ_MODEL, "messages": [{"role": "system", "content": system}, *messages], "max_tokens": max_tokens},
            )
        )
    if not payloads:
        raise HTTPException(status_code=503, detail="No LLM key configured.")
    last_error: Exception | None = None
    async with httpx.AsyncClient(timeout=60) as client:
        for url, headers, body in payloads:
            try:
                res = await client.post(url, headers=headers, json=body)
                res.raise_for_status()
                data = res.json()
                if data.get("error"):
                    raise ValueError(str(data["error"]))
                text = (data["choices"][0]["message"]["content"] or "").strip()
                if not text:
                    raise ValueError("Empty response from the coach.")
                return ChatResponse(text=text, modelUsed=data.get("model") or body["model"])
            except Exception as exc:  # fall through to the next provider
                last_error = exc
    raise HTTPException(status_code=502, detail=f"All LLM providers failed: {last_error}")


COACH_SYSTEM = (
    "You are a strength-training coach. You receive one workout's structured "
    "stats (exercise, reps, scores, form-issue counts). Reply with a SINGLE "
    "JSON object and nothing else: "
    '{"summary": "...", "strengths": ["..."], "improvements": ["..."], '
    '"nextWorkoutAdvice": "...", "voiceMessage": "..."}. '
    "voiceMessage is one short spoken sentence (max 25 words). "
    "Never invent data that is not in the stats."
)


def parse_coach_json(text: str) -> CoachOutput:
    cleaned = text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    try:
        return CoachOutput.model_validate(json.loads(cleaned))
    except Exception:
        raise HTTPException(status_code=502, detail="Coach returned invalid JSON.")


# --- Routes ---


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/ai/analyze")
def analyze(summary: WorkoutSummary, authorization: str | None = Header(default=None)) -> dict:
    check_auth(authorization)
    # Rule-based only, no LLM: rates and the top issue straight from the counts.
    total = max(summary.totalReps, 1)
    main_issue = max(summary.issues.items(), key=lambda kv: kv[1], default=(None, 0))[0]
    return {
        "exercise": summary.exercise,
        "goodRepRate": round(summary.goodReps / total, 3),
        "badRepRate": round(summary.badReps / total, 3),
        "averageScore": summary.averageScore,
        "mainIssue": main_issue,
    }


@app.post("/ai/workout-summary", response_model=CoachOutput)
async def workout_summary(
    summary: WorkoutSummary, authorization: str | None = Header(default=None)
) -> CoachOutput:
    check_auth(authorization)
    stats = summary.model_dump_json()
    res = await complete(COACH_SYSTEM, [{"role": "user", "content": stats}], 2000)
    return parse_coach_json(res.text)


@app.post("/ai/coach", response_model=ChatResponse)
async def coach(req: ChatRequest, authorization: str | None = Header(default=None)) -> ChatResponse:
    check_auth(authorization)
    return await complete(req.system, req.messages, req.maxTokens)


@app.post("/ai/voice")
def voice(req: VoiceRequest, authorization: str | None = Header(default=None)) -> dict[str, str]:
    check_auth(authorization)
    # ponytail: no cloud TTS wired yet - the client speaks this via browser
    # SpeechSynthesis through VoiceService. Add a provider when premium voice matters.
    return {"engine": "browser", "text": req.text}


@app.get("/ai/exercises/{exercise_id}")
def get_exercise(exercise_id: str, authorization: str | None = Header(default=None)) -> dict:
    check_auth(authorization)
    exercise = EXERCISES.get(exercise_id.strip().lower())
    if exercise is None:
        raise HTTPException(status_code=404, detail="Unknown exercise.")
    return exercise
