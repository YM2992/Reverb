#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// Include necessary libraries for CC1101
#include <ELECHOUSE_CC1101_SRC_DRV.h>
#include <RCSwitch.h>

BLEServer *pServer = NULL;
BLECharacteristic *pSensorCharacteristic = NULL;
BLECharacteristic *pLedCharacteristic = NULL;
bool deviceConnected = false;
bool oldDeviceConnected = false;

const int ledPin = 2;      // Use the appropriate GPIO pin for your setup
const int cc1101RxPin = 4; // CC1101 GDO2 pin
const int cc1101TxPin = 2; // CC1101 GDO0 pin (if needed for transmission)

#define SERVICE_UUID "a78662a0-ec99-41ab-89c1-80669d309a56"
#define SENSOR_CHARACTERISTIC_UUID "089b232b-0302-4ae1-92e1-2f7ca3be3827"
#define LED_CHARACTERISTIC_UUID "63603106-e584-4c3e-90bc-764ae02ceefc"

RCSwitch rcSwitch = RCSwitch();


// Class to handle CC1101 and RCSwitch initialization and operations
class CC1101RCSwitchManager
{
public:
  CC1101RCSwitchManager(int rxPin) : rxPin(rxPin) {}
  CC1101RCSwitchManager(int rxPin, int txPin) : rxPin(rxPin), txPin(txPin) {}

  void begin()
  {
    // Set SPI pins: SCK, MISO, MOSI, CSN
    ELECHOUSE_cc1101.setSpiPin(18, 19, 23, 5);
    ELECHOUSE_cc1101.Init();
    ELECHOUSE_cc1101.setMHZ(433.92);
    rcSwitch.enableReceive(rxPin);
    ELECHOUSE_cc1101.SetRx();
    if (ELECHOUSE_cc1101.getCC1101())
    {
      Serial.println("CC1101 Connection OK");
    }
    else
    {
      Serial.println("CC1101 Connection Error");
    }
  }

  // Call in loop to check for received signals and send to BLE if available
  void checkReceiveAndSendBLE(BLECharacteristic *bleChar, bool notify)
  {
    if (rcSwitch.available())
    {
      unsigned long receivedValue = rcSwitch.getReceivedValue();
      if (receivedValue)
      {
        Serial.print("Received: ");
        Serial.print(receivedValue);
        Serial.print(" (");
        Serial.print(String(433.92));
        Serial.print(", ");
        Serial.print(ELECHOUSE_cc1101.getRssi());
        Serial.println(")");

        if (bleChar != nullptr)
        {
          // Prepare JSON string with all relevant data
          char jsonBuf[128];
          snprintf(jsonBuf, sizeof(jsonBuf),
                   "{\"data\":%lu,\"freq\":%.2f,\"rssi\":%d}",
                   receivedValue,
                   433.92,
                   ELECHOUSE_cc1101.getRssi());
          bleChar->setValue(jsonBuf);
          if (notify)
          {
            bleChar->notify();
            Serial.println(String("Notified BLE client with: ") + jsonBuf);
          }
        }
      }
      else
      {
        Serial.println("Unknown encoding");
      }
      rcSwitch.resetAvailable();
    }
  }

  void sendSignal(unsigned long value, unsigned int length)
  {
    rcSwitch.enableTransmit(txPin);
    rcSwitch.send(value, length);
    Serial.print("Sent: ");
    Serial.println(value);
  }

  void setRxPin(int pin) { rxPin = pin; }
  void setTxPin(int pin) { txPin = pin; }

private:
  int rxPin;
  int txPin = -1;
};

class MyServerCallbacks : public BLEServerCallbacks
{
  void onConnect(BLEServer *pServer)
  {
    deviceConnected = true;
  };

  void onDisconnect(BLEServer *pServer)
  {
    deviceConnected = false;
  }
};

class MyCharacteristicCallbacks : public BLECharacteristicCallbacks
{
  void onWrite(BLECharacteristic *pLedCharacteristic)
  {
    String value = pLedCharacteristic->getValue();
    if (value.length() > 0)
    {
      Serial.print("Characteristic event, written: ");
      Serial.println(static_cast<int>(value[0])); // Print the integer value

      int receivedValue = static_cast<int>(value[0]);
      if (receivedValue == 1)
      {
        digitalWrite(ledPin, HIGH);
      }
      else
      {
        digitalWrite(ledPin, LOW);
      }
    }
  }
};

// Create a global instance for CC1101 and RCSwitch management
CC1101RCSwitchManager cc1101Manager(cc1101RxPin, cc1101TxPin);

void setup()
{
  Serial.begin(115200);
  pinMode(ledPin, OUTPUT);

  // Initialize CC1101 and RCSwitch
  cc1101Manager.begin();

  // Create the BLE Device
  BLEDevice::init("ESP32");

  // Create the BLE Server
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  // Create the BLE Service
  BLEService *pService = pServer->createService(SERVICE_UUID);

  // Create a BLE Characteristic
  pSensorCharacteristic = pService->createCharacteristic(
      SENSOR_CHARACTERISTIC_UUID,
      BLECharacteristic::PROPERTY_READ |
          BLECharacteristic::PROPERTY_WRITE |
          BLECharacteristic::PROPERTY_NOTIFY |
          BLECharacteristic::PROPERTY_INDICATE);

  // Create the ON button Characteristic
  pLedCharacteristic = pService->createCharacteristic(
      LED_CHARACTERISTIC_UUID,
      BLECharacteristic::PROPERTY_WRITE);

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
  pAdvertising->setMinPreferred(0x0); // set value to 0x00 to not advertise this parameter
  BLEDevice::startAdvertising();
  Serial.println("Waiting for a client...");
}

void loop()
{
  // Check for received RF signals and send to BLE client if connected
  cc1101Manager.checkReceiveAndSendBLE(pSensorCharacteristic, deviceConnected);
  // disconnecting
  if (!deviceConnected && oldDeviceConnected)
  {
    Serial.println("Device disconnected.");
    delay(500);                  // give the bluetooth stack the chance to get things ready
    pServer->startAdvertising(); // restart advertising
    Serial.println("Start advertising");
    oldDeviceConnected = deviceConnected;
  }
  // connecting
  if (deviceConnected && !oldDeviceConnected)
  {
    // do stuff here on connecting
    oldDeviceConnected = deviceConnected;
    Serial.println("Device Connected");
  }
}