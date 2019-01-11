CREATE TABLE IF NOT EXISTS ClusteringName (
  id                      INTEGER PRIMARY KEY,
  name                    TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS ClusterLabel(
	cluster_id              INTEGER NOT NULL,
	cluster                 INTEGER NOT NULL,
	label                   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ClusteringData(
	cluster_id              INTEGER NOT NULL,
	timestamp               REAL NOT NULL,
	location_latitude       REAL,
	location_longitude      REAL,
	cluster                 INTEGER NOT NULL,
	FOREIGN KEY (cluster_id) REFERENCES ClusteringName(id),
	PRIMARY KEY (cluster_id, timestamp)
);