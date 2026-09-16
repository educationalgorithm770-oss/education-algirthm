@echo off
@chcp 65001 >nul
title Code Arena — Code Runner Engine
echo ===============================================================
echo [Code Arena] Starting Production Code Runner Microservice...
echo ===============================================================
set CODE_RUNNER_PORT=8088
set CODE_RUNNER_TOKEN=cr_sec_token_9876543210_prod_key
node services/code-runner/server.js
pause
