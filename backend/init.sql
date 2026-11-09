-- Esquema inicial v1. No es una migración de bases ya existentes.
BEGIN;


CREATE TABLE IF NOT EXISTS schema_revision (
	id SERIAL NOT NULL,
	PRIMARY KEY (id)
)

;


CREATE TABLE IF NOT EXISTS shops (
	id VARCHAR(36) NOT NULL,
	slug VARCHAR(80) NOT NULL,
	config JSON NOT NULL,
	categories JSON NOT NULL,
	extras JSON NOT NULL,
	admin_hash VARCHAR(64) NOT NULL,
	version INTEGER NOT NULL,
	PRIMARY KEY (id),
	UNIQUE (slug)
)

;


CREATE TABLE IF NOT EXISTS audit_events (
	id VARCHAR(36) NOT NULL,
	shop_id VARCHAR(36) NOT NULL,
	resource_id VARCHAR(80) NOT NULL,
	kind VARCHAR(60) NOT NULL,
	details JSON NOT NULL,
	created_at TIMESTAMP WITH TIME ZONE NOT NULL,
	PRIMARY KEY (id),
	FOREIGN KEY(shop_id) REFERENCES shops (id)
)

;

CREATE INDEX IF NOT EXISTS ix_audit_events_shop_id ON audit_events (shop_id);


CREATE TABLE IF NOT EXISTS orders (
	id VARCHAR(36) NOT NULL,
	folio VARCHAR(40) NOT NULL,
	shop_id VARCHAR(36) NOT NULL,
	idempotency_key VARCHAR(36) NOT NULL,
	request_hash VARCHAR(64) NOT NULL,
	snapshot JSON NOT NULL,
	total INTEGER NOT NULL,
	minimum_deposit INTEGER NOT NULL,
	paid INTEGER NOT NULL,
	status VARCHAR(32) NOT NULL,
	pickup_confirmed VARCHAR(160) NOT NULL,
	version INTEGER NOT NULL,
	created_at TIMESTAMP WITH TIME ZONE NOT NULL,
	PRIMARY KEY (id),
	CONSTRAINT uq_order_attempt UNIQUE (shop_id, idempotency_key),
	UNIQUE (folio),
	FOREIGN KEY(shop_id) REFERENCES shops (id)
)

;

CREATE INDEX IF NOT EXISTS ix_orders_shop_id ON orders (shop_id);


CREATE TABLE IF NOT EXISTS products (
	shop_id VARCHAR(36) NOT NULL,
	id VARCHAR(80) NOT NULL,
	data JSON NOT NULL,
	version INTEGER NOT NULL,
	PRIMARY KEY (shop_id, id),
	FOREIGN KEY(shop_id) REFERENCES shops (id)
)

;

INSERT INTO schema_revision (id) VALUES (1) ON CONFLICT DO NOTHING;

COMMIT;
