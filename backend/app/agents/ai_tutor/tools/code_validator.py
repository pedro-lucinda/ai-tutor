"""Code validator tool for the Validation Agent.

Checks Python code examples by parsing them with `ast` and running them in a
restricted namespace. Non-Python code snippets are accepted without execution.
"""

import ast
import textwrap
from typing import Literal


def validate_code_example(
    code: str,
    language: Literal["python", "other"] = "python",
) -> str:
    """Validate a code example from a lesson.

    For Python code: parses with ast.parse and runs in a restricted namespace.
    For other languages: accepts without execution (returns 'valid').

    Returns a short status string:
    - 'valid' if no issues found
    - A human-readable error message describing the problem
    """
    if language != "python":
        return "valid"

    code = textwrap.dedent(code).strip()
    if not code:
        return "valid"

    # 1. Syntax check
    try:
        tree = ast.parse(code)
    except SyntaxError as exc:
        return f"SyntaxError at line {exc.lineno}: {exc.msg}"

    # 2. Detect obviously unsafe patterns (no imports of dangerous modules)
    dangerous = {"os", "subprocess", "sys", "shutil", "importlib", "socket"}
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                if alias.name.split(".")[0] in dangerous:
                    return f"Unsafe import detected: {alias.name}"
        if isinstance(node, ast.ImportFrom):
            if node.module and node.module.split(".")[0] in dangerous:
                return f"Unsafe import detected: {node.module}"

    # 3. Execute in a sandboxed namespace — catch runtime errors
    safe_builtins = {
        "print": print,
        "range": range,
        "len": len,
        "int": int,
        "float": float,
        "str": str,
        "bool": bool,
        "list": list,
        "dict": dict,
        "set": set,
        "tuple": tuple,
        "enumerate": enumerate,
        "zip": zip,
        "map": map,
        "filter": filter,
        "sorted": sorted,
        "reversed": reversed,
        "sum": sum,
        "min": min,
        "max": max,
        "abs": abs,
        "round": round,
        "isinstance": isinstance,
        "issubclass": issubclass,
        "type": type,
        "hasattr": hasattr,
        "getattr": getattr,
        "setattr": setattr,
        "repr": repr,
        "Exception": Exception,
        "ValueError": ValueError,
        "TypeError": TypeError,
        "KeyError": KeyError,
        "IndexError": IndexError,
        "StopIteration": StopIteration,
        "NotImplementedError": NotImplementedError,
    }
    namespace: dict = {"__builtins__": safe_builtins}

    try:
        exec(compile(tree, "<lesson-example>", "exec"), namespace)  # noqa: S102
    except Exception as exc:  # noqa: BLE001
        return f"RuntimeError: {type(exc).__name__}: {exc}"

    return "valid"
