CREATE TABLE IF NOT EXISTS SensorData100Hz(
  id                      INTEGER PRIMARY KEY,
  server_id               INTEGER NOT NULL,
  sensor_id               INTEGER NOT NULL,
  server_send_timestamp   INTEGER NOT NULL,
  sensor_synced_timestamp INTEGER NOT NULL,
  sensor_raw_timestamp    INTEGER NOT NULL,
  quat_w                  REAL NOT NULL,
  quat_x                  REAL NOT NULL,
  quat_y                  REAL NOT NULL,
  quat_z                  REAL NOT NULL,
  gyro_x                  REAL NOT NULL,
  gyro_y                  REAL NOT NULL,
  gyro_z                  REAL NOT NULL,
  acc_x                   REAL NOT NULL,
  acc_y                   REAL NOT NULL,
  acc_z                   REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS SensorData20Hz(
  id                      INTEGER PRIMARY KEY,
  server_id               INTEGER NOT NULL,
  sensor_id               INTEGER NOT NULL,
  server_send_timestamp   INTEGER NOT NULL,
  sensor_synced_timestamp INTEGER NOT NULL,
  sensor_raw_timestamp    INTEGER NOT NULL,
  magn_x                   REAL NOT NULL,
  magn_y                  REAL NOT NULL,
  magn_z                  REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS SensorMessage(
  id                      INTEGER PRIMARY KEY,
  server_id               INTEGER NOT NULL,
  sensor_id               INTEGER NOT NULL,
  server_send_timestamp   INTEGER NOT NULL,
  client_recv_timestamp   INTEGER NOT NULL,
  client_send_timestamp   INTEGER NOT NULL,
  server_recv_timestamp   INTEGER NOT NULL,
  num_100hz_data          INTEGER NOT NULL,
  num_20hz_data           INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS sensor_synced_timestamp_100 ON SensorData100Hz(sensor_synced_timestamp);
CREATE INDEX IF NOT EXISTS server_send_timestamp_100 ON SensorData100Hz(server_send_timestamp);
CREATE INDEX IF NOT EXISTS sensor_raw_timestamp_100 ON SensorData100Hz(sensor_raw_timestamp);
CREATE INDEX IF NOT EXISTS id_100 ON SensorData100Hz(sensor_id, server_id);

CREATE INDEX IF NOT EXISTS sensor_synced_timestamp_20 ON SensorData20Hz(sensor_synced_timestamp);
CREATE INDEX IF NOT EXISTS server_send_timestamp_20 ON SensorData20Hz(server_send_timestamp);
CREATE INDEX IF NOT EXISTS sensor_raw_timestamp_20 ON SensorData20Hz(sensor_raw_timestamp);
CREATE INDEX IF NOT EXISTS id_20 ON SensorData20Hz(sensor_id, server_id);

CREATE INDEX IF NOT EXISTS id_sensor_message ON SensorMessage(sensor_id, server_id);
CREATE INDEX IF NOT EXISTS server_send_sensor_message ON SensorMessage(server_send_timestamp);
CREATE INDEX IF NOT EXISTS client_recv_sensor_message ON SensorMessage(client_recv_timestamp);
CREATE INDEX IF NOT EXISTS client_send_sensor_message ON SensorMessage(client_send_timestamp);
CREATE INDEX IF NOT EXISTS server_recv_sensor_message ON SensorMessage(server_recv_timestamp);

CREATE VIEW IF NOT EXISTS NUM_DATA AS
SELECT  server_id, sensor_id, SUM(num_100hz_data) AS num_data_100hz, SUM(num_20hz_data) AS num_data_20hz
FROM SensorMessage
GROUP BY server_id, sensor_id;

