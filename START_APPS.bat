@echo off
echo ========================================
echo     Starting All Applications
echo ========================================
echo.

echo [1/9] Starting WeatherMeter Backend (NestJS - port 3000)...
start "WeatherMeter-Backend" cmd /k "cd /d %~dp0WeatherMeterManagement\backend && npm run start:dev"

timeout /t 5 /nobreak > nul

echo [2/9] Starting WeatherMeter Frontend (port 3001)...
start "WeatherMeter-Frontend" cmd /k "cd /d %~dp0WeatherMeterManagement\frontend && npm start"

timeout /t 3 /nobreak > nul

echo [3/9] Starting SolarPowerMeter Backend (Express - port 5000)...
start "SolarPowerMeter-Backend" cmd /k "cd /d %~dp0SolarPowerMeter\server && npm start"

timeout /t 3 /nobreak > nul

echo [4/9] Starting SolarPowerMeter Client (port 5174)...
start "SolarPowerMeter-Client" cmd /k "cd /d %~dp0SolarPowerMeter\client && npm run dev"

timeout /t 3 /nobreak > nul

echo [5/9] Starting Inverter Details Backend (Express - port 5002)...
start "InverterDetails-Backend" cmd /k "cd /d %~dp0Inverter_Details\server && npm start"

timeout /t 3 /nobreak > nul

echo [6/9] Starting Inverter Details Frontend (port 5175)...
start "InverterDetails-Frontend" cmd /k "cd /d %~dp0Inverter_Details && npm run dev"

timeout /t 3 /nobreak > nul

echo [7/9] Starting Final Submission Backend (Express - port 5003)...
start "FinalSubmission-Backend" cmd /k "cd /d %~dp0Final_Submission\server && npm start"

timeout /t 3 /nobreak > nul

echo [8/9] Starting Final Submission Frontend (port 5176)...
start "FinalSubmission-Frontend" cmd /k "cd /d %~dp0Final_Submission && npm run dev"

timeout /t 3 /nobreak > nul

echo [9/9] Starting App Launcher (port 5173)...
start "AppLauncher" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ========================================
echo     All Applications Started!
echo ========================================
echo.
echo FRONTEND APPS:
echo - App Launcher:            http://localhost:5173
echo - WeatherMeter Frontend:   http://localhost:3001
echo - SolarPowerMeter Client:  http://localhost:5174
echo - Inverter Details:        http://localhost:5175
echo - Final Submission:        http://localhost:5176
echo.
echo BACKEND APIs:
echo - WeatherMeter Backend:    http://localhost:3000
echo - SolarPowerMeter Backend: http://localhost:5000
echo - Inverter Details Backend: http://localhost:5002
echo - Final Submission Backend: http://localhost:5003
echo.
echo NOTE: Backends need MongoDB running!
echo.
pause
