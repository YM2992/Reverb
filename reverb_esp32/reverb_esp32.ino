#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// Include necessary libraries for CC1101
#include <ELECHOUSE_CC1101_SRC_DRV.h>
#include <RCSwitch.h>

#include <cstdint> // Required for uint32_t

BLEServer *pServer = NULL;
BLECharacteristic *pSensorCharacteristic = NULL;
BLECharacteristic *pLedCharacteristic = NULL;
bool deviceConnected = false;
bool oldDeviceConnected = false;

const int ledPin = 2;      // Use the appropriate GPIO pin for your setup
const int cc1101TxPin = 2; // CC1101 GDO0 pin (if needed for transmission)
const int cc1101RxPin = 4; // CC1101 GDO2 pin

const int TX_RX_DEBOUNCE = 2000; // Debounce time for TX/RX switching (ms)

#define SERVICE_UUID "a78662a0-ec99-41ab-89c1-80669d309a56"
#define SENSOR_CHARACTERISTIC_UUID "089b232b-0302-4ae1-92e1-2f7ca3be3827"
#define LED_CHARACTERISTIC_UUID "63603106-e584-4c3e-90bc-764ae02ceefc"
#define MODE_CHARACTERISTIC_UUID "b7e1e2a1-7b2a-4e2b-8e2a-7b2a4e2b8e2a"

enum OperationMode
{
  MODE_IDLE = 0,
  MODE_RX = 1,
  MODE_TX = 2,
  MODE_OTHER = 3
};
OperationMode currentMode = MODE_RX;
unsigned long lastTxValue = 0;
unsigned int lastTxBitLength = 24; // Default bit length for TX
unsigned long lastTxReceivedMillis = 0;

// --- TX Command Parsing and State ---
unsigned long continualTxValue = 0;
unsigned int continualTxBitLength = 24;
unsigned long continualTxStartMillis = 0;
bool continualTxActive = false;
const unsigned long CONTINUAL_TX_TIMEOUT = 5000;

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
        // Set RX
        rcSwitch.enableReceive(rxPin);
        ELECHOUSE_cc1101.SetRx();

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
    if (txPin == -1)
    {
      Serial.println("TX pin not set, cannot send signal.");
      currentMode = MODE_RX;
      lastTxValue = 0;
      lastTxBitLength = 0;
      Serial.println("Switched to RX mode");
      forceRxMode();
      return;
    }

    rcSwitch.enableTransmit(txPin);
    ELECHOUSE_cc1101.SetTx();

    rcSwitch.send(value, length);
    Serial.print("Sent: ");
    Serial.println(value);

    rcSwitch.resetAvailable();
    forceRxMode();
  }

  void forceRxMode()
  {
    rcSwitch.enableReceive(rxPin);
    ELECHOUSE_cc1101.SetRx();
    Serial.println("Forced RX mode (CC1101 and RCSwitch)");
  }

  void setRxPin(int pin) { rxPin = pin; }
  void setTxPin(int pin) { txPin = pin; }

private:
  int rxPin;
  int txPin = -1;
};

// Create a global instance for CC1101 and RCSwitch management
CC1101RCSwitchManager cc1101Manager(cc1101RxPin, cc1101TxPin);

bool parseTxMessage(const String &msg, int &txMode, unsigned long &data)
{
  // Format: "TX,[0/1/2],[data]"
  if (!msg.startsWith("TX,"))
    return false;
  int firstComma = msg.indexOf(',', 3);
  if (firstComma == -1)
    return false;
  String modeStr = msg.substring(3, firstComma);
  int secondComma = msg.indexOf(',', firstComma + 1);
  String dataStr = (secondComma == -1) ? msg.substring(firstComma + 1) : msg.substring(firstComma + 1, secondComma);
  txMode = modeStr.toInt();
  data = dataStr.toInt();
  return true;
}

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
  void onWrite(BLECharacteristic *pChar)
  {
    String value = pChar->getValue();
    if (pChar->getUUID().toString() == LED_CHARACTERISTIC_UUID)
    {
      if (value.length() > 0)
      {
        int txMode = -1;
        unsigned long txData = 0;
        if (parseTxMessage(value, txMode, txData))
        {
          Serial.print("Parsed TX message: mode=");
          Serial.print(txMode);
          Serial.print(", data=");
          Serial.println(txData);
          handleTxCommand(txMode, txData);
        }
        else
        {
          // Fallback: Accept both stringified numbers and raw bytes
          unsigned long txValue = 0;
          if (value.length() >= 4)
          {
            txValue = *reinterpret_cast<const uint32_t *>(value.c_str());
          }
          else
          {
            txValue = value.toInt();
          }
          lastTxValue = txValue;
          lastTxBitLength = 24; // You may want to set this dynamically
          Serial.print("Received TX value: ");
          Serial.println(lastTxValue);
          // Switch to TX mode and record time
          currentMode = MODE_TX;
          lastTxReceivedMillis = millis();
          cc1101Manager.sendSignal(lastTxValue, lastTxBitLength);
          lastTxValue = 0;
        }
      }
    }
    else if (pChar->getUUID().toString() == MODE_CHARACTERISTIC_UUID)
    {
      if (value.length() > 0)
      {
        int mode = value.toInt();
        if (mode >= 0 && mode <= 2)
        {
          currentMode = static_cast<OperationMode>(mode);
          Serial.print("Mode set to: ");
          Serial.println(currentMode == MODE_RX ? "RX" : (currentMode == MODE_TX ? "TX" : "OTHER"));
        }
      }
    }
  }
};

void handleTxCommand(int txMode, unsigned long data)
{
  switch (txMode)
  {
  case 0: // STOP TX
    continualTxActive = false;
    continualTxValue = 0;
    currentMode = MODE_RX;
    Serial.println("TX STOPPED, switching to RX mode");
    break;
  case 1: // TRANSMIT ONCE
    continualTxActive = false;
    continualTxValue = 0;
    currentMode = MODE_TX;
    lastTxValue = data;
    lastTxBitLength = 24;
    lastTxReceivedMillis = millis();
    cc1101Manager.sendSignal(lastTxValue, lastTxBitLength);
    lastTxValue = 0;
    currentMode = MODE_RX;
    Serial.println("TX ONCE complete, switching to RX mode");
    break;
  case 2: // CONTINUAL TRANSMISSION
    continualTxActive = true;
    continualTxValue = data;
    continualTxBitLength = 24;
    continualTxStartMillis = millis();
    currentMode = MODE_TX;
    Serial.println("CONTINUAL TX STARTED");
    break;
  default:
    Serial.println("Unknown TX mode");
    break;
  }
}

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

  // Create the mode characteristic
  BLECharacteristic *pModeCharacteristic = pService->createCharacteristic(
      MODE_CHARACTERISTIC_UUID,
      BLECharacteristic::PROPERTY_READ |
          BLECharacteristic::PROPERTY_WRITE);

  // Register the callback for the characteristics
  pLedCharacteristic->setCallbacks(new MyCharacteristicCallbacks());
  pModeCharacteristic->setCallbacks(new MyCharacteristicCallbacks());

  // https://www.bluetooth.com/specifications/gatt/viewer?attributeXmlFile=org.bluetooth.descriptor.gatt.client_characteristic_configuration.xml
  // Create a BLE Descriptor
  pSensorCharacteristic->addDescriptor(new BLE2902());
  pLedCharacteristic->addDescriptor(new BLE2902());
  pModeCharacteristic->addDescriptor(new BLE2902());

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
  unsigned long now = millis();

  // If in TX mode, check for timeout
  if (currentMode == MODE_TX)
  {
    if (continualTxActive)
    {
      // Continual transmission mode
      if (millis() - continualTxStartMillis > CONTINUAL_TX_TIMEOUT)
      {
        continualTxActive = false;
        continualTxValue = 0;
        currentMode = MODE_RX;
        Serial.println("CONTINUAL TX TIMEOUT, switching to RX mode");
      }
      else
      {
        cc1101Manager.sendSignal(continualTxValue, continualTxBitLength);
        delay(100); // adjust as needed for repeat rate
      }
    }
    else
    {
      // If no new TX value for 2s, switch back to RX
      if (now - lastTxReceivedMillis > TX_RX_DEBOUNCE)
      {
        currentMode = MODE_RX;
        Serial.println("TX timeout, switching back to RX mode");
      }
    }
  }
  else if (currentMode == MODE_RX)
  {
    // RX mode: receive from CC1101 and send to BLE
    cc1101Manager.checkReceiveAndSendBLE(pSensorCharacteristic, deviceConnected);
  }
  else
  {
    // Other mode: do nothing or add custom logic
  }

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