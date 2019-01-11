CREATE TABLE IF NOT EXISTS SensorData100Hz(
  id               INTEGER PRIMARY KEY,
  server_id        INTEGER NOT NULL,
  sensor_id        INTEGER NOT NULL,
  sensor_timestamp INTEGER NOT NULL,
  server_timestamp INTEGER NOT NULL,
  quat_w           REAL NOT NULL,
  quat_x           REAL NOT NULL,
  quat_y           REAL NOT NULL,
  quat_z           REAL NOT NULL,
  gyro_x           REAL NOT NULL,
  gyro_y           REAL NOT NULL,
  gyro_z           REAL NOT NULL,
  lacc_x           REAL NOT NULL,
  lacc_y           REAL NOT NULL,
  lacc_z           REAL NOT NULL,
  acc_x            REAL NOT NULL,
  acc_y            REAL NOT NULL,
  acc_z            REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS SensorData20Hz(
  id               INTEGER PRIMARY KEY,
  server_id        INTEGER NOT NULL,
  sensor_id        INTEGER NOT NULL,
  sensor_timestamp INTEGER NOT NULL,
  server_timestamp INTEGER NOT NULL,
  mag_x            REAL NOT NULL,
  mag_y            REAL NOT NULL,
  mag_z            REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS SensorData1Hz(
  id               INTEGER PRIMARY KEY,
  server_id        INTEGER NOT NULL,
  sensor_id        INTEGER NOT NULL,
  sensor_timestamp INTEGER NOT NULL,
  server_timestamp INTEGER NOT NULL,
  temp             INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS SensorFreq(
  id               INTEGER PRIMARY KEY,
  server_id        INTEGER NOT NULL,
  sensor_id        INTEGER NOT NULL,
  server_timestamp INTEGER NOT NULL,
  frequency        INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS sensor_timestamp_100 ON SensorData100Hz(sensor_timestamp);
CREATE INDEX IF NOT EXISTS server_timestamp_100 ON SensorData100Hz(server_timestamp);
CREATE INDEX IF NOT EXISTS sensor_timestamp_20 ON SensorData20Hz(sensor_timestamp);
CREATE INDEX IF NOT EXISTS SensorFreq_server_timestamp ON SensorFreq(server_timestamp);
CREATE INDEX IF NOT EXISTS server_timestamp_20 ON SensorData20Hz(server_timestamp);
CREATE INDEX IF NOT EXISTS sensor_timestamp_1 ON SensorData1Hz(sensor_timestamp);
CREATE INDEX IF NOT EXISTS server_timestamp_1 ON SensorData1Hz(server_timestamp);
CREATE INDEX IF NOT EXISTS id_100 ON SensorData100Hz(sensor_id, server_id);
CREATE INDEX IF NOT EXISTS id_20 ON SensorData20Hz(sensor_id, server_id);
CREATE INDEX IF NOT EXISTS id_1 ON SensorData1Hz(sensor_id, server_id);
CREATE INDEX IF NOT EXISTS SensorFreq_id ON SensorFreq(sensor_id, server_id)
