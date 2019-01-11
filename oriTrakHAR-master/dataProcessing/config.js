module.exports = {
  UPDATE_INTERVAL: 600,    // sqlite database begin transaction - commit interval
  SOCKET_IO_PORT: 8088,
  EULER_ORDER: 'YZX',
  ANSWER_INTERVAL: 5,
  // Now sensor DICT

  // SENSOR_DICT: {
  //   '11212505': 'torso',
  //   '11211141': 'leftArm',
  //   '4257178': 'rightArm',
  //   '3074338': 'head'
  // },
  SENSOR_DICT: {
    '11212505': 'torso',
    '3080144': 'leftArm',
    '4257178': 'rightArm',
    '3074338': 'head'
  },
  // SENSOR_DICT: {
  //   '4257178': 'torso',
  //   '3080144': 'leftArm',
  //   '4257286': 'rightArm',
  //   '3074338': 'head'
  // },
  PORT: 9000,
  HEALTH_PORT: 6000,
  POLL_INTERVAL_MIN: 50,
  POLL_INTERVAL_MAX: 100,
  TINY_SYNC_NUM_POINTS: 8,
  DEFAULT_TORSO_OFFSET: {
    w: -0.01483116439305834,
    x: 0.6592238955120293,
    y: 0.747234344297174,
    z: 0.08257845853418903
  },
  DEFAULT_HEAD_OFFSET: {
    w: -0.10168719246516468,
    x: 0.6256875209846358,
    y: 0.772480857046293,
    z: 0.038392103277664215
  },
  FREE_FALL_ACC_THRESHOLD: 1.5,
  STATIC_ACC_MIN: 9.7,
  STATIC_ACC_MAX: 9.9,
  SOURCE_PATH: '/home/yuhui/OriTrak_data/03_29_18_data/userActivityData.db',
  OUTPUT_PATH: '/home/yuhui/OriTrak_data/03_29_18_data/userActivityData_preprocessed.db',
  CSV_PATH: '/home/yuhui/OriTrak_data/03_29_18_data/my_iOS_device_2018-03-29_14-48-02_-0400.csv',
  PROCESSED_DATA_PATH: '/home/yuhui/OriTrak_data/03_29_18_data/userActivityData_preprocessed.db',
  FEATURE_OUTPUT: '/home/yuhui/OriTrak_data/03_29_18_data/feature.csv',
  CLUSTER_DB_PATH: '/home/yuhui/OriTrak_data/03_29_18_data/cluster.db',
  CLUSTER_RESULT_FILE: '/home/yuhui/OriTrak_data/03_29_18_data/histogram_cluster.csv',
  ACTIVITY_DICT: {
    unknown: 1,
    stationary: 2,
    walking: 3,
    running: 4,
    cycling: 5,
    automotive: 6
  },
  NUMBER_RECORDS_TO_INSERT: 20000,
  TIME_OFFSET: 1000000, // 1s in micro s. For skipping the 0 data points when a sensor starts
  PROCESSING_BATCH_SIZE: 6000000,
  FEATURE_LENGTH: 30000000,
  HIST_BIN_SIZE: 30.0,
  WINDOW_SIZE: 2048,
  SAMPLE_RATE: 100
}
