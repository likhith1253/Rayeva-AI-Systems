from datetime import datetime
from typing import List
from pydantic import BaseModel, Field

class OrderProduct(BaseModel):
    name: str = Field(min_length=2)
    category: str
    quantity: int = Field(ge=1)
    is_sustainable: bool
    weight_grams: float = Field(gt=0)
    is_local: bool

class ImpactRequest(BaseModel):
    order_id: str = Field(min_length=3)
    products: List[OrderProduct] = Field(min_length=1)

class ImpactMetrics(BaseModel):
    plastic_saved_grams: float
    carbon_avoided_kg: float
    local_sourcing_percent: float
    trees_equivalent: float

class ImpactResponse(BaseModel):
    id: int
    order_id: str
    products: List[OrderProduct]
    total_quantity: int
    metrics: ImpactMetrics
    impact_statement: str
    created_at: datetime

class ImpactListItem(BaseModel):
    id: int
    order_id: str
    total_quantity: int
    plastic_saved_grams: float
    carbon_avoided_kg: float
    created_at: datetime
