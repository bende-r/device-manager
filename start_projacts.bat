@echo off
echo Starting both projects...

:: Переменная для хранения PID (Process ID) запущенных процессов
setlocal

:: Запуск первого проекта (npm start)
start cmd /k "cd web-client && npm start --host 0.0.0.0" 
set npm_pid=%!

:: Запуск второго проекта (python app.py)
start cmd /k "cd server && python app.py"
set python_pid=%!

:: Ожидание для завершения (закрытие консоли)
echo Both projects have been started. Press any key to stop them...
pause >nul

:: Завершение всех процессов, запущенных BAT-файлом
echo Terminating processes...
taskkill /PID %npm_pid% /F /T
taskkill /PID %python_pid% /F /T

echo All processes have been terminated.
pause
