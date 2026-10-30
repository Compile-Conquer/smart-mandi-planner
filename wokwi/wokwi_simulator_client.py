"""MandiMitra AI - Local Python Telemetry Streamer for Wokwi / Sensor Testing."""
import time
import math
import random
import argparse
import requests

DEFAULT_ENDPOINT = "http://127.0.0.1:8000/api/storage/sensor/dht22"

def run_streamer(endpoint: str = DEFAULT_ENDPOINT, mode: str = "normal", delay: float = 2.0):
    print("==========================================================")
    print("MandiMitra AI - Wokwi ESP32 + DHT22 Python Telemetry Client")
    print(f"Target Endpoint: {endpoint}")
    print(f"Simulation Mode: {mode.upper()}")
    print("Press Ctrl+C to terminate.")
    print("==========================================================")

    step = 0
    while True:
        step += 1
        noise_t = random.uniform(-0.15, 0.15)
        noise_h = random.uniform(-0.4, 0.4)

        if mode == "normal":
            temp = round(12.5 + 0.3 * math.sin(step / 10.0) + noise_t, 2)
            hum = round(88.0 + 0.8 * math.cos(step / 10.0) + noise_h, 1)
        elif mode == "spike":
            # Gradual spike to 19.5°C
            temp = round(12.5 + min(7.0, step * 0.3) + noise_t, 2)
            hum = round(max(70.0, 88.0 - step * 0.4) + noise_h, 1)
        elif mode == "power_cut":
            # Rapid asymptotic temperature rise
            temp = round(28.0 - (28.0 - 12.5) * math.exp(-0.04 * step) + noise_t, 2)
            hum = round(max(65.0, 88.0 - step * 0.6) + noise_h, 1)
        elif mode == "chilling":
            temp = round(6.5 + noise_t, 2)
            hum = round(92.0 + noise_h, 1)
        else:
            temp = 12.8
            hum = 87.5

        payload = {
            "device_id": "WOKWI_ESP32_DHT22_01",
            "temperature_c": temp,
            "humidity_pct": hum,
            "source": "WOKWI_SIMULATOR",
            "is_simulated": True
        }

        try:
            res = requests.post(endpoint, json=payload, timeout=3)
            if res.status_code == 200:
                print(f"[Step {step:03d}] Sent: {temp:5.2f} °C | {hum:4.1f} % RH -> Response: 200 OK")
            else:
                print(f"[Step {step:03d}] HTTP {res.status_code}: {res.text}")
        except Exception as e:
            print(f"[Step {step:03d}] Connection failed: {e}")

        time.sleep(delay)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Wokwi DHT22 Sensor Telemetry Streamer")
    parser.add_argument("--url", default=DEFAULT_ENDPOINT, help="Backend telemetry URL")
    parser.add_argument("--mode", default="normal", choices=["normal", "spike", "power_cut", "chilling"])
    parser.add_argument("--delay", type=float, default=2.5, help="Interval in seconds")
    args = parser.parse_args()

    try:
        run_streamer(args.url, args.mode, args.delay)
    except KeyboardInterrupt:
        print("\nTelemetry streamer stopped.")
