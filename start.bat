@echo off
echo Starting Plasma Donor...
echo.

echo Starting server on port 5000...
start "Server" cmd /k "npm run dev"

echo Waiting 5 seconds for server to start...
timeout /t 5 /nobreak > nul

echo Starting client on port 3000...
start "Client" cmd /k "cd client && npm start"

echo.
echo Both server and client should now be running!
echo Server: http://localhost:5000
echo Client: http://localhost:3000
echo.
echo Press any key to close this window...
pause > nul 