@echo off
set ANTHROPIC_BASE_URL=http://localhost:20128/v1
set ANTHROPIC_AUTH_TOKEN=sk-7d51e3f4e723aa18-9e3837-0ad91300
set ANTHROPIC_API_KEY=sk-7d51e3f4e723aa18-9e3837-0ad91300

:: Disable experimental betas (crucial for 3rd party proxies like OmniRoute)
set CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS=1

set ANTHROPIC_MODEL=kr/claude-sonnet-4.5
set ANTHROPIC_SMALL_FAST_MODEL=kr/claude-sonnet-4.5
set CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1

"%AppData%\npm\claude.cmd" --model %ANTHROPIC_MODEL% %*
