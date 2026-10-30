# Wokwi ESP32 + DHT22 Digital Twin Integration

This directory contains the IoT simulation assets for connecting an ESP32 micro-controller and DHT22 temperature/humidity sensor to the MandiMitra AI Cold Storage Digital Twin.

## Files
1. `diagram.json`: Standard Wokwi wiring blueprint connecting an ESP32 board to a DHT22 sensor (Pin 15).
2. `wokwi_esp32_dht22.ino`: Arduino C++ firmware that samples sensor data and POSTs telemetry via WiFi to the MandiMitra AI backend endpoint `/api/storage/sensor/dht22`.
3. `wokwi_simulator_client.py`: Python CLI tool to stream telemetry directly from your terminal with configurable modes (`normal`, `spike`, `power_cut`, `chilling`).

## Method 1: Using the Python Telemetry Streamer (No browser needed)
In a terminal, run:
```powershell
python wokwi/wokwi_simulator_client.py --mode normal
```
To simulate a temperature excursion / power cut:
```powershell
python wokwi/wokwi_simulator_client.py --mode power_cut
```

## Method 2: Running in Wokwi Browser Simulator
1. Open [Wokwi ESP32 Simulator](https://wokwi.com/projects/new/esp32).
2. Copy the contents of `diagram.json` into the `diagram.json` tab in Wokwi.
3. Copy `wokwi_esp32_dht22.ino` into `sketch.ino`.
4. Add the `DHT sensor library for ESPx` in the Library Manager tab in Wokwi.
5. In `wokwi_esp32_dht22.ino`, set `serverUrl` to your deployed backend or local proxy URL.
6. Click **Start Simulation**.
