export type DataCoapType = [
  {
    testId: 'MAIN_MCU_BLE_SIGNAL';
    results: {
      result: string;
      details: {
        deviceId: string;
        rssi: number;
      };
    };
  },
  {
    testId: 'Sensor';
    results: {
      result: string;
      details: {
        smokeValue: number;
      };
    };
  },
  {
    testId: 'BATTERY_VOLTAGE';
    results: {
      result: string;
      details: {
        source: string;
        voltage: number;
      };
    };
  },
  {
    testId: 'CELLULAR_SIM';
    results: {
      result: string;
      details: {
        imsi: string;
      };
    };
  },
  {
    testId: 'CELLULAR_SIGNAL';
    results: {
      result: string;
      details: {
        band: string;
        deviceNetworkRssiDbm: number;
        gsmStatus: string;
        networkReport: {
          absoluteRadioFrequencyChannel: string;
          areaTacChangeCount: string;
          cellChangeCount: string;
          cellId: string;
          connectionStatus: string;
          extendedDiscontinuousReception: string;
          ipAddress: string;
          mcc: string;
          mnc: string;
          referenceSignalReceivedPower: string;
          referenceSignalReceivedQuality: string;
          requestedActiveTime: string;
          requestedPeriodicTrackingAreaUpdate: string;
          tac: string;
        };
      };
    };
  },
];
