"""Tavily web search tool for the Curriculum Research Agent."""

import os
from typing import Literal

from tavily import TavilyClient

_client: TavilyClient | None = None


def _get_client() -> TavilyClient:
    global _client
    if _client is None:
        api_key = os.environ.get("TAVILY_API_KEY", "")
        _client = TavilyClient(api_key=api_key)
    return _client


def internet_search(
    query: str,
    max_results: int = 5,
    topic: Literal["general", "news"] = "general",
) -> str:
    """Search the web for up-to-date educational resources, syllabi, and documentation.

    Use this to find university curricula, official documentation, bootcamp outlines,
    and textbook content for a given programming or technical topic.
    Returns a concatenated summary of the top search results.
    """
    client = _get_client()
    response = client.search(query, max_results=max_results, topic=topic)
    results = response.get("results", [])
    if not results:
        return "No results found."

    parts = []
    for r in results:
        title = r.get("title", "")
        url = r.get("url", "")
        content = r.get("content", "")
        parts.append(f"### {title}\nURL: {url}\n{content}")

    return "\n\n---\n\n".join(parts)
