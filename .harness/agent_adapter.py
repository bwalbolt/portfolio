#!/usr/bin/env python3
"""Agent CLI adapter for harness headless sessions."""

from __future__ import annotations

import subprocess
from dataclasses import dataclass
from pathlib import Path

AgentName = str


@dataclass(frozen=True)
class AgentOptions:
    """Options shared by runner and evaluator when spawning an agent."""

    agent: AgentName = "codex"
    model: str | None = None
    profile: str | None = None
    codex_sandbox: str = "workspace-write"


def build_agent_command(
    *,
    options: AgentOptions,
    root: Path,
    allowed_tools: str | None = None,
    output_format: str | None = None,
) -> list[str]:
    """Build a command that reads the prompt from stdin."""
    if options.agent == "codex":
        cmd = [
            "codex",
            "exec",
            "--cd",
            str(root),
            "--sandbox",
            options.codex_sandbox,
            "--ask-for-approval",
            "never",
            "--color",
            "never",
        ]
        if options.model:
            cmd.extend(["--model", options.model])
        if options.profile:
            cmd.extend(["--profile", options.profile])
        cmd.append("-")
        return cmd

    if options.agent == "claude":
        cmd = ["claude", "-p"]
        if options.model:
            cmd.extend(["--model", options.model])
        if allowed_tools:
            cmd.extend(["--allowedTools", allowed_tools])
        if output_format:
            cmd.extend(["--output-format", output_format])
        return cmd

    raise ValueError(f"Unsupported agent: {options.agent}")


def format_command_for_display(cmd: list[str]) -> str:
    """Return a shell-ish command preview without quoting the stdin prompt."""
    return " ".join(cmd)


def run_agent_session(
    *,
    prompt: str,
    options: AgentOptions,
    root: Path,
    allowed_tools: str | None = None,
    output_format: str | None = None,
    capture_output: bool,
) -> subprocess.CompletedProcess:
    """Run an agent session, passing the prompt through stdin."""
    cmd = build_agent_command(
        options=options,
        root=root,
        allowed_tools=allowed_tools,
        output_format=output_format,
    )
    return subprocess.run(
        cmd,
        cwd=root,
        input=prompt,
        capture_output=capture_output,
        text=True,
    )
