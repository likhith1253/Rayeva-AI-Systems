from datetime import datetime
from typing import List
from pydantic import BaseModel, Field, model_validator

class ProposalRequest(BaseModel):
    client_name: str = Field(min_length=3)
    industry: str = Field(min_length=3)
    budget: int = Field(ge=5000)
    headcount: int = Field(ge=5)
    sustainability_priorities: List[str] = Field(min_length=1, max_length=5)

    @model_validator(mode='after')
    def check_budget_per_employee(self):
        if self.budget and self.headcount:
            if self.budget / self.headcount < 100:
                raise ValueError("Budget too low for this headcount — minimum ₹100 per employee")
        return self

class ProposalProduct(BaseModel):
    name: str
    category: str
    quantity: int
    unit_price: int
    total_price: int
    sustainability_benefit: str
    why_recommended: str

class ProposalResponse(BaseModel):
    id: int
    client_name: str
    industry: str
    budget: int
    headcount: int
    sustainability_priorities: List[str]
    proposed_products: List[ProposalProduct]
    total_cost: int
    cost_per_employee: float
    budget_utilization_percent: float
    impact_summary: str
    budget_adjusted: bool
    created_at: datetime

class ProposalListItem(BaseModel):
    id: int
    client_name: str
    industry: str
    budget: int
    headcount: int
    created_at: datetime
