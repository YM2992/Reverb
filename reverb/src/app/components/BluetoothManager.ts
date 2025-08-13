// BluetoothManager.ts
// Encapsulates all BLE logic for connection, reading, writing, and notifications

export type BluetoothState = {
    deviceName: string;
    bleState: string;
    bleStateColor: string;
    lastValueReceived: string;
    lastValueSent: string;
    connectionEstablishedTimestamp: number;
    lastReceivedTimestamp: number;
};

export class BluetoothManager {
    private deviceName = "ESP32";
    private bleService = "19b10000-e8f2-537e-4f6c-d104768a1214";
    private ledCharacteristic = "19b10002-e8f2-537e-4f6c-d104768a1214";
    private sensorCharacteristic = "19b10001-e8f2-537e-4f6c-d104768a1214";

    private bleServer: unknown = null;
    private bleServiceFound: unknown = null;
    private sensorCharacteristicFound: unknown = null;

    public state: BluetoothState = {
        deviceName: this.deviceName,
        bleState: "Disconnected",
        bleStateColor: "#d13a30",
        lastValueReceived: "-",
        lastValueSent: "-",
        connectionEstablishedTimestamp: -1,
        lastReceivedTimestamp: -1,
    };

    private setState(partial: Partial<BluetoothState>) {
        this.state = { ...this.state, ...partial };
    }

    isWebBluetoothEnabled(): boolean {
        if (typeof navigator === "undefined" || !("bluetooth" in navigator)) {
            this.setState({
                bleState: "Web Bluetooth API is not available in this browser!",
                bleStateColor: "#d13a30",
            });
            return false;
        }
        return true;
    }

    async connect(onStateChange: (state: BluetoothState) => void) {
        if (!this.isWebBluetoothEnabled()) {
            onStateChange(this.state);
            return;
        }
        this.setState({ bleState: "Initializing Bluetooth...", bleStateColor: "#888" });
        onStateChange(this.state);
        try {
            const nav = navigator as Navigator & { bluetooth?: unknown };
            if (!nav.bluetooth || typeof nav.bluetooth !== "object") throw new Error("Bluetooth not available");
            // @ts-expect-error: Web Bluetooth API is not in TS lib yet
            const device = await nav.bluetooth.requestDevice({
                filters: [{ services: [this.bleService] }]
            });
            this.setState({ bleState: `Connected to device ${device.name}`, bleStateColor: "#24af37", deviceName: device.name, connectionEstablishedTimestamp: Date.now() });
            onStateChange(this.state);
            device.addEventListener("gattservicedisconnected", () => this.onDisconnected(onStateChange));
            const gattServer = await device.gatt.connect();
            this.bleServer = gattServer;
            const service = await gattServer.getPrimaryService(this.bleService);
            this.bleServiceFound = service;
            const characteristic = await service.getCharacteristic(this.sensorCharacteristic);
            this.sensorCharacteristicFound = characteristic;
            characteristic.addEventListener("characteristicvaluechanged", (event: Event) => this.handleCharacteristicChange(event, onStateChange));
            await characteristic.startNotifications();
            const value = await characteristic.readValue();
            const decodedValue = new TextDecoder().decode(value);
            this.setState({ lastValueReceived: decodedValue });
            onStateChange(this.state);
        } catch {
            this.setState({ bleState: "Error connecting to device", bleStateColor: "#d13a30" });
            onStateChange(this.state);
        }
    }

    private onDisconnected(onStateChange: (state: BluetoothState) => void) {
        this.setState({ bleState: "Device disconnected", bleStateColor: "#d13a30", deviceName: "-", connectionEstablishedTimestamp: -1, lastReceivedTimestamp: -1 });
        onStateChange(this.state);
    }

    private handleCharacteristicChange(event: Event, onStateChange: (state: BluetoothState) => void) {
        const target = event.target as { value?: DataView };
        if (!target || !target.value) return;
        const newValueReceived = new TextDecoder().decode(target.value);
        this.setState({ lastValueReceived: newValueReceived, lastReceivedTimestamp: Date.now() });
        onStateChange(this.state);
    }

    async writeOnCharacteristic(val: number, onStateChange: (state: BluetoothState) => void) {
        const server = this.bleServer as { connected?: boolean } | null;
        const service = this.bleServiceFound as { getCharacteristic?: (uuid: string) => Promise<unknown> } | null;
        if (server && server.connected) {
            try {
                if (!service || typeof service.getCharacteristic !== 'function') throw new Error("BLE service not found");
                const characteristic = await service.getCharacteristic(this.ledCharacteristic) as { writeValue?: (data: Uint8Array) => Promise<void> };
                const data = new Uint8Array([val]);
                if (characteristic.writeValue) await characteristic.writeValue(data);
                this.setState({ lastValueSent: val.toString() });
                onStateChange(this.state);
            } catch (error) {
                window.alert("Error writing to the LED characteristic.\n" + error);
            }
        } else {
            window.alert("Bluetooth is not connected. Cannot write to characteristic. Connect to BLE first!");
        }
    }

    async disconnect(onStateChange: (state: BluetoothState) => void) {
        const server = this.bleServer as { connected?: boolean; disconnect?: () => Promise<void> } | null;
        const characteristic = this.sensorCharacteristicFound as { stopNotifications?: () => Promise<void> } | null;
        if (server && server.connected) {
            try {
                if (characteristic && typeof characteristic.stopNotifications === 'function') {
                    await characteristic.stopNotifications();
                }
                if (server.disconnect) {
                    await server.disconnect();
                }
                this.setState({ bleState: "Device Disconnected", bleStateColor: "#d13a30" });
                onStateChange(this.state);
            } catch (error) {
                window.alert("An error occurred while disconnecting.\n" + error);
            }
        } else {
            window.alert("Bluetooth is not connected.");
        }
    }

    private getDateTime() {
        const currentdate = new Date();
        const day = ("00" + currentdate.getDate()).slice(-2);
        const month = ("00" + (currentdate.getMonth() + 1)).slice(-2);
        const year = currentdate.getFullYear();
        const hours = ("00" + currentdate.getHours()).slice(-2);
        const minutes = ("00" + currentdate.getMinutes()).slice(-2);
        const seconds = ("00" + currentdate.getSeconds()).slice(-2);
        return `${day}/${month}/${year} at ${hours}:${minutes}:${seconds}`;
    }
}
