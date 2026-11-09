import re
from typing import Annotated, Literal
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class StrictModel(BaseModel):
    model_config = ConfigDict(extra='forbid', populate_by_name=True)


class BankDestination(StrictModel):
    bank: str = Field(min_length=2, max_length=80)
    holder: str = Field(min_length=3, max_length=120)
    type: Literal['clabe', 'account', 'card']
    number: str

    @field_validator('bank', 'holder', mode='before')
    @classmethod
    def clean_text(cls, value):
        if not isinstance(value, str):
            raise ValueError('Escribe banco y titular como texto.')
        value = value.strip()
        if not value or '\n' in value or '\r' in value:
            raise ValueError('Revisa banco y titular.')
        return value

    @model_validator(mode='after')
    def validate_number(self):
        self.number = re.sub(r'[ -]', '', self.number)
        lengths = {'clabe': (18, 18), 'account': (6, 20), 'card': (16, 19)}
        low, high = lengths[self.type]
        if not self.number.isascii() or not self.number.isdigit() or not low <= len(self.number) <= high:
            raise ValueError('Formato de número inválido para el destino elegido.')
        return self


class BusinessConfig(StrictModel):
    name: str = Field(min_length=2, max_length=100)
    tagline: str = Field(default='', max_length=180)
    whatsapp: str = Field(default='', max_length=15, pattern=r'^(?:[1-9]\d{9,14})?$')
    address: str = Field(default='', max_length=300)
    hours: str = Field(default='', max_length=300)
    primaryColor: str = Field(default='#bb3828', pattern=r'^#[0-9a-fA-F]{6}$')
    acceptingOrders: bool = False
    testMode: bool = True
    preparationMin: int = Field(default=25, ge=1, le=240)
    preparationMax: int = Field(default=35, ge=1, le=240)
    bankDestination: BankDestination | None = None

    @model_validator(mode='after')
    def check_ready(self):
        if self.preparationMax < self.preparationMin:
            raise ValueError('El tiempo máximo debe ser igual o mayor al mínimo.')
        if self.acceptingOrders and (not self.bankDestination or not self.whatsapp or len(self.address.strip()) < 5 or not self.hours.strip()):
            raise ValueError('Antes de recibir pedidos configura banco, WhatsApp, dirección y horarios.')
        return self


class ConfigUpdate(StrictModel):
    expectedVersion: int = Field(ge=1)
    config: BusinessConfig
    bankChangeAcknowledged: bool = False


class Variant(StrictModel):
    name: str = Field(min_length=1, max_length=50)
    price: Annotated[int, Field(strict=True, ge=100, le=10000000)]


class ProductUpdate(StrictModel):
    expectedVersion: int = Field(ge=1)
    name: str = Field(min_length=2, max_length=100)
    description: str = Field(max_length=600)
    available: bool
    variants: list[Variant] = Field(min_length=1, max_length=12)


class ProductCreate(StrictModel):
    expectedCatalogVersion: int = Field(ge=1)
    category: str = Field(min_length=1, max_length=80)
    name: str = Field(min_length=2, max_length=100)
    description: str = Field(default='', max_length=600)
    available: bool = True
    variants: list[Variant] = Field(min_length=1, max_length=12)


class CategoryChange(StrictModel):
    expectedVersion: int = Field(ge=1)
    name: str = Field(min_length=2, max_length=60)
    subtitle: str = Field(default='', max_length=160)
    icon: Literal['pizza','utensils','flame','burger','cake','cup','wine','sparkles'] = 'utensils'


class Customer(StrictModel):
    name: str = Field(min_length=3, max_length=80)
    phone: str = Field(pattern=r'^\d{10,15}$')
    pickup: str = Field(pattern=r'^(?:asap|(?:[01]\d|2[0-3]):[0-5]\d)$')


class LineInput(StrictModel):
    productId: str = Field(min_length=1, max_length=80)
    productVersion: Annotated[int, Field(strict=True, ge=1)]
    halfVersion: Annotated[int, Field(strict=True, ge=1)] | None = None
    variantIndex: Annotated[int, Field(strict=True, ge=0, le=11)]
    quantity: Annotated[int, Field(strict=True, ge=1, le=30)]
    halfId: str = Field(default='', max_length=80)
    extras: list[str] = Field(default_factory=list, max_length=30)
    selections: dict[str, str] = Field(default_factory=dict, max_length=12)
    notes: str = Field(default='', max_length=180)


class OrderInput(StrictModel):
    customer: Customer
    items: list[LineInput] = Field(min_length=1, max_length=60)
    payFull: bool = False
    expectedTotal: Annotated[int, Field(strict=True, ge=100, le=100000000)]


class ConfirmInput(StrictModel):
    expectedVersion: int = Field(ge=1)
    receivedCents: Annotated[int, Field(strict=True, ge=1, le=100000000)]
    pickupConfirmed: str = Field(min_length=3, max_length=160)
    customerAgreed: bool

    @field_validator('pickupConfirmed', mode='before')
    @classmethod
    def trim_pickup(cls, value):
        if not isinstance(value, str):
            raise ValueError('Escribe el tiempo acordado.')
        return value.strip()


class StatusInput(StrictModel):
    expectedVersion: int = Field(ge=1)
    status: Literal['preparing', 'ready', 'completed']


class SettleInput(StrictModel):
    expectedVersion: int = Field(ge=1)
    receivedCents: Annotated[int, Field(strict=True, ge=1, le=100000000)]
    method: Literal['cash', 'transfer', 'card']


class VersionInput(StrictModel):
    expectedVersion: int = Field(ge=1)
