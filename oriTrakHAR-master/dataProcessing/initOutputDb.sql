CREATE TABLE IF NOT EXISTS Preprocessed100HZData (
  interpolated_fixed_rate_time INTEGER PRIMARY KEY,
  server_id                    INTEGER NOT NULL,

  torso_quat_w                 REAL DEFAULT NULL,
  torso_quat_x                 REAL DEFAULT NULL,
  torso_quat_y                 REAL DEFAULT NULL,
  torso_quat_z                 REAL DEFAULT NULL,
  torso_gyro_x                 REAL DEFAULT NULL,
  torso_gyro_y                 REAL DEFAULT NULL,
  torso_gyro_z                 REAL DEFAULT NULL,
  torso_acc_x                  REAL DEFAULT NULL,
  torso_acc_y                  REAL DEFAULT NULL,
  torso_acc_z                  REAL DEFAULT NULL,

  torso_acc_mag                REAL DEFAULT NULL,
  torso_gyro_mag               REAL DEFAULT NULL,
  torso_yaw                    REAL DEFAULT NULL,
  torso_pitch                  REAL DEFAULT NULL,
  torso_roll                   REAL DEFAULT NULL,


  head_quat_w                  REAL DEFAULT NULL,
  head_quat_x                  REAL DEFAULT NULL,
  head_quat_y                  REAL DEFAULT NULL,
  head_quat_z                  REAL DEFAULT NULL,
  head_gyro_x                  REAL DEFAULT NULL,
  head_gyro_y                  REAL DEFAULT NULL,
  head_gyro_z                  REAL DEFAULT NULL,
  head_acc_x                   REAL DEFAULT NULL,
  head_acc_y                   REAL DEFAULT NULL,
  head_acc_z                   REAL DEFAULT NULL,

  head_acc_mag                 REAL DEFAULT NULL,
  head_gyro_mag                REAL DEFAULT NULL,
  head_yaw                     REAL DEFAULT NULL,
  head_pitch                   REAL DEFAULT NULL,
  head_roll                    REAL DEFAULT NULL,
  head_relative_yaw            REAL DEFAULT NULL,
  head_relative_pitch          REAL DEFAULT NULL,
  head_relative_roll           REAL DEFAULT NULL,


  left_quat_w                  REAL DEFAULT NULL,
  left_quat_x                  REAL DEFAULT NULL,
  left_quat_y                  REAL DEFAULT NULL,
  left_quat_z                  REAL DEFAULT NULL,
  left_gyro_x                  REAL DEFAULT NULL,
  left_gyro_y                  REAL DEFAULT NULL,
  left_gyro_z                  REAL DEFAULT NULL,
  left_acc_x                   REAL DEFAULT NULL,
  left_acc_y                   REAL DEFAULT NULL,
  left_acc_z                   REAL DEFAULT NULL,

  left_acc_mag                 REAL DEFAULT NULL,
  left_gyro_mag                REAL DEFAULT NULL,
  left_yaw                     REAL DEFAULT NULL,
  left_pitch                   REAL DEFAULT NULL,
  left_roll                    REAL DEFAULT NULL,
  left_relative_yaw            REAL DEFAULT NULL,
  left_relative_pitch          REAL DEFAULT NULL,
  left_relative_roll           REAL DEFAULT NULL,


  right_quat_w                 REAL DEFAULT NULL,
  right_quat_x                 REAL DEFAULT NULL,
  right_quat_y                 REAL DEFAULT NULL,
  right_quat_z                 REAL DEFAULT NULL,
  right_gyro_x                 REAL DEFAULT NULL,
  right_gyro_y                 REAL DEFAULT NULL,
  right_gyro_z                 REAL DEFAULT NULL,
  right_acc_x                  REAL DEFAULT NULL,
  right_acc_y                  REAL DEFAULT NULL,
  right_acc_z                  REAL DEFAULT NULL,

  right_acc_mag                REAL DEFAULT NULL,
  right_gyro_mag               REAL DEFAULT NULL,
  right_yaw                    REAL DEFAULT NULL,
  right_roll                   REAL DEFAULT NULL,
  right_pitch                  REAL DEFAULT NULL,
  right_relative_yaw           REAL DEFAULT NULL,
  right_relative_pitch         REAL DEFAULT NULL,
  right_relative_roll          REAL DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS Preprocessed20HZData (
  interpolated_fixed_rate_time INTEGER PRIMARY KEY,
  server_id                    INTEGER NOT NULL,

  torso_magn_x                 REAL DEFAULT NULL,
  torso_magn_y                 REAL DEFAULT NULL,
  torso_magn_z                 REAL DEFAULT NULL,
  torso_magn_mag               REAL DEFAULT NULL,

  head_magn_x                  REAL DEFAULT NULL,
  head_magn_y                  REAL DEFAULT NULL,
  head_magn_z                  REAL DEFAULT NULL,
  head_magn_mag                REAL DEFAULT NULL,


  left_magn_x                  REAL DEFAULT NULL,
  left_magn_y                  REAL DEFAULT NULL,
  left_magn_z                  REAL DEFAULT NULL,
  left_magn_mag                REAL DEFAULT NULL,


  right_magn_x                 REAL DEFAULT NULL,
  right_magn_y                 REAL DEFAULT NULL,
  right_magn_z                 REAL DEFAULT NULL,
  right_magn_mag               REAL DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS PhoneData(
  timestamp                    REAL PRIMARY KEY,
  activity                     INTEGER NOT NULL,
  activity_confidence          REAL NOT NULL,
  pedometer_num_steps          REAL NOT NULL,
  pedometer_current_pace       REAL NOT NULL,
  pedometer_current_cadence    REAL NOT NULL,
  altimeter_relative_altitude  REAL NOT NULL,
  altimeter_pressure           REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS GPSData(
  location_timestamp           REAL PRIMARY KEY,
  timestamp                    REAL NOT NULL,
  location_latitude            REAL NOT NULL,
  location_longitude           REAL NOT NULL,
  location_altitude            REAL NOT NULL,
  location_speed               REAL NOT NULL,
  location_course              REAL NOT NULL,
  location_vertical_accuracy   REAL NOT NULL,
  location_horizontal_accuracy REAL NOT NULL,
  location_floor               REAL NOT NULL,
  FOREIGN KEY (timestamp) REFERENCES PhoneData(timestamp)
);

-- Torso Histograms
CREATE VIEW IF NOT EXISTS TorsoYawHist AS
  SELECT round(torso_yaw/5.00 - 0.5)*5 AS bucket_floor, count(*)
  FROM Preprocessed100HZData
  GROUP BY 1
  ORDER BY 1;

CREATE VIEW IF NOT EXISTS TorsoPitchHist AS
  SELECT round(torso_pitch/5.00 - 0.5)*5 AS bucket_floor, count(*)
  FROM Preprocessed100HZData
  GROUP BY 1
  ORDER BY 1;

CREATE VIEW IF NOT EXISTS TorsoRollHist AS
  SELECT round(torso_roll/5.00 - 0.5)*5 AS bucket_floor, count(*)
  FROM Preprocessed100HZData
  GROUP BY 1
  ORDER BY 1;

CREATE VIEW IF NOT EXISTS TorsoYawPitchHist AS
  SELECT
    round(torso_yaw/5.00 - 0.5)*5 AS yaw_floor,
    round(torso_pitch/5.00 - 0.5)*5 AS pitch_floor,
    count(*)
  FROM Preprocessed100HZData
  GROUP BY 1, 2
  ORDER BY 1, 2;

CREATE VIEW IF NOT EXISTS TorsoYawPitchRollHist AS
  SELECT
    round(torso_yaw/5.00 - 0.5)*5 AS yaw_floor,
    round(torso_pitch/5.00 - 0.5)*5 AS pitch_floor,
    round(torso_roll/5.00 - 0.5)*5 AS roll_floor,
    count(*)
  FROM Preprocessed100HZData
  GROUP BY 1, 2, 3
  ORDER BY 1, 2, 3;


-- Head Histograms
CREATE VIEW IF NOT EXISTS HeadYawHist AS
  SELECT round(head_yaw/5.00 - 0.5)*5 AS bucket_floor, count(*)
  FROM Preprocessed100HZData
  GROUP BY 1
  ORDER BY 1;

CREATE VIEW IF NOT EXISTS HeadPitchHist AS
  SELECT round(head_pitch/5.00 - 0.5)*5 AS bucket_floor, count(*)
  FROM Preprocessed100HZData
  GROUP BY 1
  ORDER BY 1;

CREATE VIEW IF NOT EXISTS HeadRollHist AS
  SELECT round(head_roll/5.00 - 0.5)*5 AS bucket_floor, count(*)
  FROM Preprocessed100HZData
  GROUP BY 1
  ORDER BY 1;

CREATE VIEW IF NOT EXISTS HeadYawPitchHist AS
  SELECT
    round(head_yaw/5.00 - 0.5)*5 AS yaw_floor,
    round(head_pitch/5.00 - 0.5)*5 AS pitch_floor,
    count(*)
  FROM Preprocessed100HZData
  GROUP BY 1, 2
  ORDER BY 1, 2;

CREATE VIEW IF NOT EXISTS HeadYawPitchRollHist AS
  SELECT
    round(head_yaw/5.00 - 0.5)*5 AS yaw_floor,
    round(head_pitch/5.00 - 0.5)*5 AS pitch_floor,
    round(head_roll/5.00 - 0.5)*5 AS roll_floor,
    count(*)
  FROM Preprocessed100HZData
  GROUP BY 1, 2, 3
  ORDER BY 1, 2, 3;


-- Head Relative Histograms
CREATE VIEW IF NOT EXISTS HeadRelativeYawHist AS
  SELECT round(head_relative_yaw/5.00 - 0.5)*5 AS bucket_floor, count(*)
  FROM Preprocessed100HZData
  GROUP BY 1
  ORDER BY 1;

CREATE VIEW IF NOT EXISTS HeadRelativePitchHist AS
  SELECT round(head_relative_pitch/5.00 - 0.5)*5 AS bucket_floor, count(*)
  FROM Preprocessed100HZData
  GROUP BY 1
  ORDER BY 1;

CREATE VIEW IF NOT EXISTS HeadRelativeRollHist AS
  SELECT round(head_relative_roll/5.00 - 0.5)*5 AS bucket_floor, count(*)
  FROM Preprocessed100HZData
  GROUP BY 1
  ORDER BY 1;

CREATE VIEW IF NOT EXISTS HeadRelativeYawPitchHist AS
  SELECT
    round(head_relative_yaw/5.00 - 0.5)*5 AS yaw_floor,
    round(head_relative_pitch/5.00 - 0.5)*5 AS pitch_floor,
    count(*)
  FROM Preprocessed100HZData
  GROUP BY 1, 2
  ORDER BY 1, 2;

CREATE VIEW IF NOT EXISTS HeadRelativeYawPitchRollHist AS
  SELECT
    round(head_relative_yaw/5.00 - 0.5)*5 AS yaw_floor,
    round(head_relative_pitch/5.00 - 0.5)*5 AS pitch_floor,
    round(head_relative_roll/5.00 - 0.5)*5 AS roll_floor,
    count(*)
  FROM Preprocessed100HZData
  GROUP BY 1, 2, 3
  ORDER BY 1, 2, 3;


-- Lest Histogram
CREATE VIEW IF NOT EXISTS LeftYawHist AS
  SELECT round(left_yaw/5.00 - 0.5)*5 AS bucket_floor, count(*)
  FROM Preprocessed100HZData
  GROUP BY 1
  ORDER BY 1;

CREATE VIEW IF NOT EXISTS LeftPitchHist AS
  SELECT round(left_pitch/5.00 - 0.5)*5 AS bucket_floor, count(*)
  FROM Preprocessed100HZData
  GROUP BY 1
  ORDER BY 1;

CREATE VIEW IF NOT EXISTS LeftRollHist AS
  SELECT round(left_roll/5.00 - 0.5)*5 AS bucket_floor, count(*)
  FROM Preprocessed100HZData
  GROUP BY 1
  ORDER BY 1;

CREATE VIEW IF NOT EXISTS LeftYawPitchHist AS
  SELECT
    round(left_yaw/5.00 - 0.5)*5 AS yaw_floor,
    round(left_pitch/5.00 - 0.5)*5 AS pitch_floor,
    count(*)
  FROM Preprocessed100HZData
  GROUP BY 1, 2
  ORDER BY 1, 2;

CREATE VIEW IF NOT EXISTS LeftYawPitchRollHist AS
  SELECT
    round(left_yaw/5.00 - 0.5)*5 AS yaw_floor,
    round(left_pitch/5.00 - 0.5)*5 AS pitch_floor,
    round(left_roll/5.00 - 0.5)*5 AS roll_floor,
    count(*)
  FROM Preprocessed100HZData
  GROUP BY 1, 2, 3
  ORDER BY 1, 2, 3;


--Left Relative Histogram
CREATE VIEW IF NOT EXISTS LeftRelativeYawHist AS
  SELECT round(left_relative_yaw/5.00 - 0.5)*5 AS bucket_floor, count(*)
  FROM Preprocessed100HZData
  GROUP BY 1
  ORDER BY 1;

CREATE VIEW IF NOT EXISTS LeftRelativePitchHist AS
  SELECT round(left_relative_pitch/5.00 - 0.5)*5 AS bucket_floor, count(*)
  FROM Preprocessed100HZData
  GROUP BY 1
  ORDER BY 1;

CREATE VIEW IF NOT EXISTS LeftRelativeRollHist AS
  SELECT round(left_relative_roll/5.00 - 0.5)*5 AS bucket_floor, count(*)
  FROM Preprocessed100HZData
  GROUP BY 1
  ORDER BY 1;

CREATE VIEW IF NOT EXISTS LeftRelativeYawPitchHist AS
  SELECT
    round(left_relative_yaw/5.00 - 0.5)*5 AS yaw_floor,
    round(left_relative_pitch/5.00 - 0.5)*5 AS pitch_floor,
    count(*)
  FROM Preprocessed100HZData
  GROUP BY 1, 2
  ORDER BY 1, 2;

CREATE VIEW IF NOT EXISTS LeftRelativeYawPitchRollHist AS
  SELECT
    round(left_relative_yaw/5.00 - 0.5)*5 AS yaw_floor,
    round(left_relative_pitch/5.00 - 0.5)*5 AS pitch_floor,
    round(left_relative_roll/5.00 - 0.5)*5 AS roll_floor,
    count(*)
  FROM Preprocessed100HZData
  GROUP BY 1, 2, 3
  ORDER BY 1, 2, 3;


-- Right histogram
CREATE VIEW IF NOT EXISTS RightYawHist AS
  SELECT round(right_yaw/5.00 - 0.5)*5 AS bucket_floor, count(*)
  FROM Preprocessed100HZData
  GROUP BY 1
  ORDER BY 1;

CREATE VIEW IF NOT EXISTS RightPitchHist AS
  SELECT round(right_pitch/5.00 - 0.5)*5 AS bucket_floor, count(*)
  FROM Preprocessed100HZData
  GROUP BY 1
  ORDER BY 1;

CREATE VIEW IF NOT EXISTS RightRollHist AS
  SELECT round(right_roll/5.00 - 0.5)*5 AS bucket_floor, count(*)
  FROM Preprocessed100HZData
  GROUP BY 1
  ORDER BY 1;

CREATE VIEW IF NOT EXISTS RightYawPitchHist AS
  SELECT
    round(right_yaw/5.00 - 0.5)*5 AS yaw_floor,
    round(right_pitch/5.00 - 0.5)*5 AS pitch_floor,
    count(*)
  FROM Preprocessed100HZData
  GROUP BY 1, 2
  ORDER BY 1, 2;

CREATE VIEW IF NOT EXISTS RightYawPitchRollHist AS
  SELECT
    round(right_yaw/5.00 - 0.5)*5 AS yaw_floor,
    round(right_pitch/5.00 - 0.5)*5 AS pitch_floor,
    round(right_roll/5.00 - 0.5)*5 AS roll_floor,
    count(*)
  FROM Preprocessed100HZData
  GROUP BY 1, 2, 3
  ORDER BY 1, 2, 3;

-- Right Relative histogram
CREATE VIEW IF NOT EXISTS RightRelativeYawHist AS
  SELECT round(right_relative_yaw/5.00 - 0.5)*5 AS bucket_floor, count(*)
  FROM Preprocessed100HZData
  GROUP BY 1
  ORDER BY 1;

CREATE VIEW IF NOT EXISTS RightRelativePitchHist AS
  SELECT round(right_relative_pitch/5.00 - 0.5)*5 AS bucket_floor, count(*)
  FROM Preprocessed100HZData
  GROUP BY 1
  ORDER BY 1;

CREATE VIEW IF NOT EXISTS RightRelativeRollHist AS
  SELECT round(right_relative_roll/5.00 - 0.5)*5 AS bucket_floor, count(*)
  FROM Preprocessed100HZData
  GROUP BY 1
  ORDER BY 1;

CREATE VIEW IF NOT EXISTS RightRelativeYawPitchHist AS
  SELECT
    round(right_relative_yaw/5.00 - 0.5)*5 AS yaw_floor,
    round(right_relative_pitch/5.00 - 0.5)*5 AS pitch_floor,
    count(*)
  FROM Preprocessed100HZData
  GROUP BY 1, 2
  ORDER BY 1, 2;

CREATE VIEW IF NOT EXISTS RightRelativeYawPitchRollHist AS
  SELECT
    round(right_relative_yaw/5.00 - 0.5)*5 AS yaw_floor,
    round(right_relative_pitch/5.00 - 0.5)*5 AS pitch_floor,
    round(right_relative_roll/5.00 - 0.5)*5 AS roll_floor,
    count(*)
  FROM Preprocessed100HZData
  GROUP BY 1, 2, 3
  ORDER BY 1, 2, 3;