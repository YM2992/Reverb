# Reverb

This project is a companion application for an ESP32 device equipped with a CC1101 module. It enables you to connect to your ESP32 over Bluetooth Low Energy (BLE), view and replay received Sub-GHz RF signals from a web interface.

## Features

- **BLE Connection**: Connect/disconnect to your ESP32 device via BLE.
- **Signal List**: View detected/received signals with columns for Frequency, Data, and RSSI.
- **Signal Replay**: Select a time range and replay signals within that range.

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

2. Install dependencies:
   ```sh
   npm install
   ```

3. Start the development server:
   ```sh
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```sh
npm run build
npm start
```

### PWA Installation

- On mobile, open the app in Chrome or Safari and use "Add to Home Screen" to install as a PWA.

## Project Structure

- `reverb_esp32/` - ESP32 Arduino firmware.
- `reverb/` - Next.js web application.
  - `src/app/components/` - React components for BLE, signal list, replay, and footer.
  - `public/` - Static assets and SVG icons.
  - `src/app/manifest.ts` - PWA manifest.

## License

MIT License.

## Credits

- BLE and web UI based on [Random Nerd Tutorials](https://randomnerdtutorials.com/esp32-web-bluetooth/).
- Icons from [SVG Repo](https://www.svgrepo.com/)