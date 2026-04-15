@echo off
set ANTHROPIC_BASE_URL=http://localhost:20128/v1
set ANTHROPIC_AUTH_TOKEN=sk-aee078f969d013f8-bbb4a9-2a9614e8
set ANTHROPIC_MODEL=kr/claude-sonnet-4.5
set ANTHROPIC_SMALL_FAST_MODEL=kr/claude-sonnet-4.5
set CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
"%AppData%\npm\claude.cmd" %*
