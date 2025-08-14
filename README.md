<p align="left">
   <img src="reverb/public/reverb_icon.png" alt="Reverb Icon" width="48" style="vertical-align:middle; margin-right: 12px;" />
   <span style="font-size:2.5rem; vertical-align:middle;"><b>Reverb</b></span>
</p>

This project is a companion application for an ESP32 device equipped with a CC1101 module. It enables you to connect to your ESP32 over BLE, view and replay received
[sub-GHz RF signals](https://www.reddit.com/r/flipperzero/comments/1bkmqm6/guys_i_need_help_because_i_dont_know_what_subghz/#:~:text=%E2%80%9CSub%2DGHz%E2%80%9D%20refers%20to,for%20transmissions%20in%20that%20range.)
from a web interface.

## Features

- **BLE Connection**: Connect/disconnect to your ESP32 device via BLE.

- **Record Signals**: View detected/received signals with columns for Frequency, Data, and RSSI.

- **Transmit Signals**: Send custom RF signals from the web interface.

- **Replay Signals**: Select a time range and replay signals within that range.

### Coming Soon

- **Wardriving**: Map and analyse RF signals in your area.

- **Signal Map**: Visualise recorded signals on a map.

## Hardware

- ESP32
- CC1101

## Hardware Diagram

<div style="background: linear-gradient(135deg, #f0f4f8 0%, #d9e7fa 100%); padding: 32px; border-radius: 16px; text-align: center; margin-bottom: 24px;">
   <img src="assets/hardware_diagram.svg" alt="Hardware Diagram" style="max-width: 90%; width: 700px; min-width: 320px; height: auto; display: inline-block;" />
</div>

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- [npm](https://www.npmjs.com/)
- An ESP32 flashed with the provided firmware (`reverb_esp32.ino`)

### ESP32 Firmware

The firmware for the ESP32 is located at [`reverb_esp32/reverb_esp32.ino`](reverb_esp32/reverb_esp32.ino). Flash this to your ESP32 using the Arduino IDE or PlatformIO.

### Running the Web App

1. Navigate to the `reverb` directory:

   ```sh
   cd reverb
   ```

1. Install dependencies:

   ```sh
   npm install
   ```

1. Start the development server:

   ```sh
   npm run dev
   ```

### Building for Production

```sh
npm run build
npm start
```

### Using the App

On your bluetooth-enabled device:
1. Open [http://HOST_IP:3000](http://HOST_IP:3000) in your browser.

   (replace HOST_IP with the actual IP address of the machine running the app)

### PWA Installation

- On mobile, open the app in Chrome or Safari and use "Add to Home Screen" to install as a PWA.

## App

[screenshots to come]

## License

MIT License.

## Credits

- Inspiration from [SubMarine](https://github.com/simondankelmann/SubMarine)
- BLE and web UI based on [Random Nerd Tutorials](https://randomnerdtutorials.com/esp32-web-bluetooth/).
- Icons from [SVG Repo](https://www.svgrepo.com/)
