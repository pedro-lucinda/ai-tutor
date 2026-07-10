"""SSE utilities for streaming agent progress to the frontend.

Usage in a FastAPI route:
    async def event_gen():
        async for line in some_stream_function(...):
            yield line
    return StreamingResponse(event_gen(), media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
"""

import json
from typing import Any, AsyncIterator

from langchain_core.utils.json import parse_partial_json


def format_sse(payload: dict) -> str:
    """Format a dict as a single SSE data line."""
    return f"data: {json.dumps(payload)}\n\n"


def _get_agent_name_from_task_event(data: dict) -> str:
    tool_input = data.get("input") or {}
    if isinstance(tool_input, dict):
        return tool_input.get("subagent_type") or ""
    return ""


def map_langgraph_event(event: dict) -> dict | None:
    """Convert a raw LangGraph astream_events v2 event into a frontend-facing event dict.

    Returns None for events that should be silently dropped.
    """
    kind = event.get("event")
    name = event.get("name", "")
    data = event.get("data", {})

    # on_tool_start for the built-in 'task' tool means a subagent was called
    if kind == "on_tool_start" and name == "task":
        agent_name = _get_agent_name_from_task_event(data)
        if agent_name:
            return {"type": "agent_start", "agent": agent_name}

    if kind == "on_tool_end" and name == "task":
        agent_name = _get_agent_name_from_task_event(data)
        if agent_name:
            return {"type": "agent_end", "agent": agent_name}

    return None


def _handle_partial_tool_stream(
    raw: dict,
    partial_tool_name: str,
    buffer_state: dict[str, Any],
) -> dict | None:
    """Accumulate structured-output tool-call arg chunks and emit lesson_delta events."""
    if raw.get("event") != "on_chat_model_stream":
        return None

    chunk = raw.get("data", {}).get("chunk")
    if chunk is None:
        return None

    tool_call_chunks = getattr(chunk, "tool_call_chunks", None) or []
    if not tool_call_chunks:
        return None

    buffer_changed = False
    for tcc in tool_call_chunks:
        if isinstance(tcc, dict):
            name = tcc.get("name")
            index = tcc.get("index")
            args = tcc.get("args") or ""
        else:
            name = getattr(tcc, "name", None)
            index = getattr(tcc, "index", None)
            args = getattr(tcc, "args", None) or ""

        if name == partial_tool_name:
            # Start of a new structured-output tool call (e.g. a regeneration
            # pass). Reset the buffer AND last_emitted so the fresh content
            # streams cleanly instead of diffing against the previous pass.
            buffer_state["active_index"] = index
            buffer_state["buffer"] = args
            buffer_state["last_emitted"] = None
            buffer_changed = True
        elif (
            buffer_state.get("active_index") is not None
            and index == buffer_state.get("active_index")
        ):
            buffer_state["buffer"] = buffer_state.get("buffer", "") + args
            buffer_changed = True

    if not buffer_changed or not buffer_state.get("buffer"):
        return None

    parsed = parse_partial_json(buffer_state["buffer"])
    if not isinstance(parsed, dict):
        return None

    last_emitted = buffer_state.get("last_emitted")
    if parsed == last_emitted:
        return None

    buffer_state["last_emitted"] = parsed
    return {"type": "lesson_delta", "data": parsed}


async def stream_agent(
    agent: Any,
    agent_input: dict,
    partial_tool_name: str | None = None,
) -> AsyncIterator[tuple[str, Any]]:
    """Yield (sse_line, None) for each progress event, then yield
    (complete_sse_line, structured_response) as the final tuple.

    Captures `structured_response` from the graph's final on_chain_end event,
    so the agent is only invoked once.

    When `partial_tool_name` is set, emits `lesson_delta` events as structured
    output tool-call arguments stream in from the model.
    """
    final_output: Any = None
    buffer_state: dict[str, Any] = {}

    async for raw in agent.astream_events(
        agent_input, version="v2", config={"recursion_limit": 50}
    ):
        # Capture structured_response from the outermost graph's chain-end event.
        if raw.get("event") == "on_chain_end":
            data_out = raw.get("data", {}).get("output", {})
            if isinstance(data_out, dict):
                sr = data_out.get("structured_response")
                if sr is not None:
                    final_output = sr

        if partial_tool_name:
            delta = _handle_partial_tool_stream(raw, partial_tool_name, buffer_state)
            if delta:
                yield format_sse(delta), None

        mapped = map_langgraph_event(raw)
        if mapped:
            yield format_sse(mapped), None

    # Serialize and emit the complete event
    if final_output is not None and hasattr(final_output, "model_dump"):
        complete_data = final_output.model_dump()
    else:
        complete_data = final_output

    yield format_sse({"type": "complete", "data": complete_data}), final_output
