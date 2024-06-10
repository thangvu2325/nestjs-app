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
      AlarmSatus: boolean;
      whiteSmokeVal: number;
      blackSmokeVal: number;
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
      band: number;
      EARFCN: number;
      PCI: number;
      connectionStatus: number;
      ipAddress: string;
      RSRP: number;
      RSSI: number;
      RSRQ: number;
      T3324: number;
      T3412: number;
      tac: string;
    };
  },
];
