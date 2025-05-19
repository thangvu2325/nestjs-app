export type dataDeviceType = [
  {
    testId: 'STATION';
    details: {
      deviceId: string;
    };
  },
  {
    testId: 'SENSOR';
    details: {
      AlarmSatus: number;
      whiteSmokeVal: number;
      blackSmokeVal: number;
      Temperature: number;
      Humidity: number;
    };
  },
  {
    testId: 'NODELIST';
    details: {
      nodeList: Array<nodeType>;
    };
  },
];
export type nodeType = {
  nodeId: string;
  sensors: {
    AlarmSatus: number;
    blackSmokeVal: number;
    whiteSmokeVal: number;
    Temperature: number;
    Humidity: number;
  };
  battery: number;
};
