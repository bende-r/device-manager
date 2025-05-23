@echo off
echo Starting both projects...

:: Запуск первого проекта (npm start)
start cmd /k "cd web-client && npm start --host 0.0.0.0"

:: Запуск второго проекта (python app.py)
start cmd /k "cd server && python app.py"

echo Both projects have been started.
pause