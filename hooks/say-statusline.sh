#!/usr/bin/env bash
CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
FLAG_FILE="$CLAUDE_DIR/.say-active"
if [ -f "$FLAG_FILE" ]; then
  MODE=$(tr -d '[:space:]' < "$FLAG_FILE")
  if [ -n "$MODE" ] && [ "$MODE" != "off" ]; then
    printf "[SAY:%s%%]\n" "$MODE"
  fi
fi