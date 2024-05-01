export type DataCoapType = [
  {
    testId: 'MAIN_MCU_MODULE_SIGNAL';
    details: {
      deviceId: string;
    };
  },
  {
    testId: 'SENSOR';
    details: {
      AlarmSatus: number;
      SmokeValue: number;
      Temperature: number;
      Humidity: number;
    };
  },
  {
    testId: 'BATTERY_VOLTAGE';
    details: {
      voltage: number;
    };
  },
  {
    testId: 'CELLULAR_SIM';
    details: {
      imsi: string;
    };
  },
  {
    testId: 'CELLULAR_SIGNAL';
    details: {
      Operator: string;
      band: string;
      EARFCN: string;
      PCI: string;
      connectionStatus: string;
      ipAddress: string;
      RSRP: string;
      RSSI: string;
      RSRQ: string;
      T3324: string;
      T3412: string;
      tac: string;
    };
  },
];
