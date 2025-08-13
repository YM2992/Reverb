#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// Include necessary libraries for CC1101
#include <ELECHOUSE_CC1101_SRC_DRV.h>
#include <RCSwitch.h>

BLEServer* pServer = NULL;
BLECharacteristic* pSensorCharacteristic = NULL;
BLECharacteristic* pLedCharacteristic = NULL;
bool deviceConnected = false;
bool oldDeviceConnected = false;
uint32_t value = 0;

const int ledPin = 2; // Use the appropriate GPIO pin for your setup
const int cc1101RxPin = 4; // CC1101 GDO2 pin

#define SERVICE_UUID        "19b10000-e8f2-537e-4f6c-d104768a1214"
#define SENSOR_CHARACTERISTIC_UUID "19b10001-e8f2-537e-4f6c-d104768a1214"
#define LED_CHARACTERISTIC_UUID "19b10002-e8f2-537e-4f6c-d104768a1214"

RCSwitch rcSwitch = RCSwitch();

// Class to handle CC1101 and RCSwitch initialization and operations
class CC1101RCSwitchManager {
public:
  CC1101RCSwitchManager(int rxPin) : rxPin(rxPin) {}

  void begin() {
    // Set SPI pins: SCK, MISO, MOSI, CSN
    ELECHOUSE_cc1101.setSpiPin(18, 19, 23, 5);
    ELECHOUSE_cc1101.Init();
    ELECHOUSE_cc1101.setMHZ(433.92);
    rcSwitch.enableReceive(rxPin);
    ELECHOUSE_cc1101.SetRx();
    if (ELECHOUSE_cc1101.getCC1101()) {
      Serial.println("CC1101 Connection OK");
    } else {
      Serial.println("CC1101 Connection Error");
    }
  }

  // Call in loop to check for received signals
  void checkReceive() {
    if (rcSwitch.available()) {
      unsigned long receivedValue = rcSwitch.getReceivedValue();
      if (receivedValue) {
        Serial.print("Received: ");
        Serial.println(receivedValue);
      } else {
        Serial.println("Unknown encoding");
      }
      rcSwitch.resetAvailable();
    }
  }

  // Transmit a signal (example usage)
  void sendSignal(unsigned long value, unsigned int length) {
    rcSwitch.enableTransmit(txPin); // Set TX pin if needed
    rcSwitch.send(value, length);
    Serial.print("Sent: ");
    Serial.println(value);
  }

  void setTxPin(int pin) { txPin = pin; }

private:
  int rxPin;
  int txPin = -1;
};

// Create a global instance for CC1101 and RCSwitch management
CC1101RCSwitchManager cc1101Manager(cc1101RxPin);


class MyServerCallbacks: public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    deviceConnected = true;
  };

  void onDisconnect(BLEServer* pServer) {
    deviceConnected = false;
  }
};

class MyCharacteristicCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic* pLedCharacteristic) {
    String value = pLedCharacteristic->getValue();
    if (value.length() > 0) {
      Serial.print("Characteristic event, written: ");
      Serial.println(static_cast<int>(value[0])); // Print the integer value

      int receivedValue = static_cast<int>(value[0]);
      if (receivedValue == 1) {
        digitalWrite(ledPin, HIGH);
      } else {
        digitalWrite(ledPin, LOW);
      }
    }
  }
};

void setup() {
  Serial.begin(115200);
  pinMode(ledPin, OUTPUT);

  // Initialize CC1101 and RCSwitch
  cc1101Manager.begin();

  // Create the BLE Device
  BLEDevice::init("Reverber");

  // Create the BLE Server
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  // Create the BLE Service
  BLEService *pService = pServer->createService(SERVICE_UUID);

  // Create a BLE Characteristic
  pSensorCharacteristic = pService->createCharacteristic(
                      SENSOR_CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_READ   |
                      BLECharacteristic::PROPERTY_WRITE  |
                      BLECharacteristic::PROPERTY_NOTIFY |
                      BLECharacteristic::PROPERTY_INDICATE
                    );

  // Create the ON button Characteristic
  pLedCharacteristic = pService->createCharacteristic(
                      LED_CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_WRITE
                    );

  // Register the callback for the ON button characteristic
  pLedCharacteristic->setCallbacks(new MyCharacteristicCallbacks());

  // https://www.bluetooth.com/specifications/gatt/viewer?attributeXmlFile=org.bluetooth.descriptor.gatt.client_characteristic_configuration.xml
  // Create a BLE Descriptor
  pSensorCharacteristic->addDescriptor(new BLE2902());
  pLedCharacteristic->addDescriptor(new BLE2902());

  // Start the service
  pService->start();

  // Start advertising
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(false);
  pAdvertising->setMinPreferred(0x0);  // set value to 0x00 to not advertise this parameter
  BLEDevice::startAdvertising();
  Serial.println("Waiting for a client...");
}

void loop() {
  // notify changed value
  if (deviceConnected) {
    pSensorCharacteristic->setValue(String(value).c_str());
    pSensorCharacteristic->notify();
    value++;
    Serial.print("New value notified: ");
    Serial.println(value);
    delay(3000); // bluetooth stack will go into congestion, if too many packets are sent, in 6 hours test i was able to go as low as 3ms
  }
  // Check for received RF signals
  cc1101Manager.checkReceive();
  // disconnecting
  if (!deviceConnected && oldDeviceConnected) {
    Serial.println("Device disconnected.");
    delay(500); // give the bluetooth stack the chance to get things ready
    pServer->startAdvertising(); // restart advertising
    Serial.println("Start advertising");
    oldDeviceConnected = deviceConnected;
  }
  // connecting
  if (deviceConnected && !oldDeviceConnected) {
    // do stuff here on connecting
    oldDeviceConnected = deviceConnected;
    Serial.println("Device Connected");
  }
}