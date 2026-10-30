/*
 * MandiMitra AI - Cold Storage Digital Twin Telemetry
 * ESP32 + DHT22 Wokwi Integration Sketch
 */
#include <WiFi.h>
#include <HTTPClient.h>
#include "DHTesp.h"

const int DHT_PIN = 15;
DHTesp dhtSensor;

// Wokwi Virtual WiFi Credentials
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// MandiMitra Backend URL
// Replace with your local IP or deployed server URL (e.g., http://192.168.1.100:8000/api/storage/sensor/dht22)
const char* serverUrl = "http://host.wokwi.internal:8000/api/storage/sensor/dht22";

void setup() {
  Serial.begin(115200);
  Serial.println("==========================================");
  Serial.println("MandiMitra AI - Digital Twin Telemetry Node");
  Serial.println("==========================================");

  dhtSensor.setup(DHT_PIN, DHTesp::DHT22);

  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected! IP address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  TempAndHumidity data = dhtSensor.getTempAndHumidity();

  if (isnan(data.temperature) || isnan(data.humidity)) {
    Serial.println("Failed to read from DHT22 sensor!");
    delay(2000);
    return;
  }

  Serial.printf("Temperature: %.2f °C | Humidity: %.2f %%\n", data.temperature, data.humidity);

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    String jsonPayload = String("{\"device_id\":\"WOKWI_ESP32_DHT22_01\",") +
                         "\"temperature_c\":" + String(data.temperature, 2) + "," +
                         "\"humidity_pct\":" + String(data.humidity, 2) + "," +
                         "\"source\":\"WOKWI_SIMULATOR\"," +
                         "\"is_simulated\":false}";

    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode > 0) {
      Serial.printf("Telemetry dispatched. HTTP Code: %d\n", httpResponseCode);
    } else {
      Serial.printf("HTTP Error: %s\n", http.errorToString(httpResponseCode).c_str());
    }
    http.end();
  } else {
    Serial.println("WiFi Disconnected. Retrying...");
  }

  delay(2500); // 2.5 second telemetry interval
}
