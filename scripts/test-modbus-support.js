import ModbusRTU from 'modbus-serial';

const client = new ModbusRTU();
const HOST = 'localhost';
const PORT = 502;
const UNIT_ID = 1;

async function test() {
    try {
        console.log(`Connecting to ${HOST}:${PORT}...`);
        await client.connectTCP(HOST, { port: PORT });
        client.setID(UNIT_ID);
        console.log('Connected.');

        // Test 1: Read Coils (FC 1) - Address 92
        try {
            console.log('\n--- Testing FC 1 (readCoils) on address 92 ---');
            const res = await client.readCoils(92, 1);
            console.log('✓ FC 1 Supported');
            console.log('Result:', res.data);
        } catch (e) {
            console.log(`✗ FC 1 Failed: ${e.message}`);
            if (e.modbusCode) console.log(`  Modbus Code: ${e.modbusCode}`);
        }

        // Test 2: Read Holding Registers (FC 3) - Address 92
        try {
            console.log('\n--- Testing FC 3 (readHoldingRegisters) on address 92 ---');
            const res = await client.readHoldingRegisters(92, 1);
            console.log('✓ FC 3 Supported');
            console.log('Result:', res.data);
        } catch (e) {
            console.log(`✗ FC 3 Failed: ${e.message}`);
            if (e.modbusCode) console.log(`  Modbus Code: ${e.modbusCode}`);
        }

    } catch (e) {
        console.error('Connection error:', e);
    } finally {
        client.close(() => { });
    }
}

test();
