from datetime import datetime, timezone
from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


def utcnow():
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class SchemaRevision(Base):
    __tablename__ = 'schema_revision'
    id: Mapped[int] = mapped_column(primary_key=True)


class Shop(Base):
    __tablename__ = 'shops'
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    slug: Mapped[str] = mapped_column(String(80), unique=True)
    config: Mapped[dict] = mapped_column(JSON)
    categories: Mapped[list] = mapped_column(JSON)
    extras: Mapped[list] = mapped_column(JSON)
    admin_hash: Mapped[str] = mapped_column(String(64))
    version: Mapped[int] = mapped_column(Integer, default=1)


class Product(Base):
    __tablename__ = 'products'
    shop_id: Mapped[str] = mapped_column(ForeignKey('shops.id'), primary_key=True)
    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    data: Mapped[dict] = mapped_column(JSON)
    version: Mapped[int] = mapped_column(Integer, default=1)


class Order(Base):
    __tablename__ = 'orders'
    __table_args__ = (UniqueConstraint('shop_id', 'idempotency_key', name='uq_order_attempt'),)
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    folio: Mapped[str] = mapped_column(String(40), unique=True)
    shop_id: Mapped[str] = mapped_column(ForeignKey('shops.id'), index=True)
    idempotency_key: Mapped[str] = mapped_column(String(36))
    request_hash: Mapped[str] = mapped_column(String(64))
    snapshot: Mapped[dict] = mapped_column(JSON)
    total: Mapped[int] = mapped_column(Integer)
    minimum_deposit: Mapped[int] = mapped_column(Integer)
    paid: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(32), default='pending_validation')
    pickup_confirmed: Mapped[str] = mapped_column(String(160), default='')
    version: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class AuditEvent(Base):
    __tablename__ = 'audit_events'
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    shop_id: Mapped[str] = mapped_column(ForeignKey('shops.id'), index=True)
    resource_id: Mapped[str] = mapped_column(String(80))
    kind: Mapped[str] = mapped_column(String(60))
    details: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
