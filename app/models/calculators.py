"""Validated request and result models for the calculator API.

All monetary values are in GBP unless a field explicitly names another currency.
"""
from typing import Literal

from pydantic import BaseModel, Field, PositiveFloat, model_validator


class SalaryTaxRequest(BaseModel):
    """Example: ``{"annual_salary_gbp": 60000, "pension_contribution_pct": 5}``."""
    annual_salary_gbp: float = Field(ge=0, le=10_000_000)
    bonus_gbp: float = Field(default=0, ge=0, le=10_000_000)
    pension_contribution_pct: float = Field(default=0, ge=0, le=100)
    is_scotland: bool = False
    student_loan: bool = False


class SalaryTaxResult(BaseModel):
    annual_gross_salary: float; income_tax: float; employee_national_insurance: float; employer_national_insurance: float
    student_loan_repayment: float; total_deductions: float; annual_take_home: float; monthly_take_home: float; effective_tax_rate_pct: float


class MortgageRequest(BaseModel):
    """Example: ``{"property_price_gbp": 350000, "deposit_gbp": 70000, "interest_rate_percent": 4.5, "term_years": 25, "property_tax_annual_gbp": 1800, "insurance_annual_gbp": 300}``."""
    property_price_gbp: PositiveFloat = Field(le=50_000_000)
    deposit_gbp: float = Field(ge=0)
    interest_rate_percent: float = Field(ge=0, le=100)
    term_years: int = Field(ge=1, le=50)
    property_tax_annual_gbp: float = Field(ge=0)
    insurance_annual_gbp: float = Field(ge=0)
    maintenance_reserve_pct: float = Field(default=1.0, ge=0, le=100)

    @model_validator(mode="after")
    def deposit_is_not_more_than_price(self) -> "MortgageRequest":
        if self.deposit_gbp > self.property_price_gbp:
            raise ValueError("deposit_gbp cannot exceed property_price_gbp")
        return self


class MortgageResult(BaseModel):
    property_price: float; deposit: float; loan_amount: float; stamp_duty_land_tax: float; monthly_mortgage_payment: float
    monthly_council_tax: float; monthly_insurance: float; monthly_maintenance_reserve: float; total_monthly_payment: float
    total_interest_over_term: float; total_cost: float


class PensionRequest(BaseModel):
    """Example: ``{"current_age": 35, "retirement_age": 67, "current_salary_gbp": 55000, "current_pension_pot_gbp": 40000, "annual_contribution_gbp": 4000, "employer_contribution_pct": 5}``."""
    current_age: int = Field(ge=16, le=100)
    retirement_age: int = Field(ge=17, le=110)
    current_salary_gbp: float = Field(ge=0)
    current_pension_pot_gbp: float = Field(ge=0)
    annual_contribution_gbp: float = Field(ge=0)
    employer_contribution_pct: float = Field(ge=0, le=100)
    annual_growth_rate_pct: float = Field(default=5.0, ge=-100, le=100)
    life_expectancy: int = Field(default=90, ge=18, le=120)

    @model_validator(mode="after")
    def retirement_is_future(self) -> "PensionRequest":
        if self.retirement_age <= self.current_age:
            raise ValueError("retirement_age must be greater than current_age")
        if self.life_expectancy <= self.retirement_age:
            raise ValueError("life_expectancy must be greater than retirement_age")
        return self


class PensionResult(BaseModel):
    current_pension_pot: float; years_to_retirement: int; annual_contribution: float; projected_pension_pot_at_retirement: float
    tax_free_lump_sum_25pct: float; taxable_pension_pot: float; annual_withdrawal_4pct: float; monthly_pension_income: float
    state_pension_monthly_estimate: float; total_monthly_retirement_income: float; years_in_retirement: int


class PersonalFinanceRequest(BaseModel):
    """Example: ``{"monthly_income_gbp": 4000, "essential_expenses_gbp": 1800, "discretionary_spending_gbp": 600, "savings_goal_gbp": 30000}``."""
    monthly_income_gbp: float = Field(ge=0)
    essential_expenses_gbp: float = Field(ge=0)
    discretionary_spending_gbp: float = Field(ge=0)
    savings_goal_gbp: float = Field(ge=0)


class PersonalFinanceResult(BaseModel):
    monthly_income: float; monthly_expenses: float; monthly_remaining: float; annual_savings_potential: float
    years_to_reach_goal: float | None; breakdown: dict[str, float]


class B2BROIRequest(BaseModel):
    """Example: ``{"project_investment_gbp": 10000, "annual_revenue_increase_gbp": 9000, "cost_savings_annual_gbp": 3000, "payback_period_months": 12}``."""
    project_investment_gbp: PositiveFloat
    annual_revenue_increase_gbp: float = Field(ge=0)
    cost_savings_annual_gbp: float = Field(ge=0)
    payback_period_months: int = Field(ge=1, le=1200, description="Business's expected payback period for comparison.")
    maintenance_cost_annual_gbp: float = Field(default=0, ge=0)
    discount_rate_pct: float = Field(default=10.0, ge=-99.99, le=1000)


class B2BROIResult(BaseModel):
    project_investment: float; annual_benefit: float; payback_period_months: int; payback_period_years: float
    months_to_breakeven: float | None; roi_percentage: float; net_present_value_5yr: float; cumulative_benefit_3yr: float
    cumulative_benefit_5yr: float; annual_roi_percentage: float


class HealthcareCostRequest(BaseModel):
    """Example: ``{"procedure_type": "cataract_surgery_private", "recovery_weeks": 4, "time_off_work_weeks": 2, "weekly_income_gbp": 800}``."""
    procedure_type: Literal["gp_consultation_private", "dermatology_private", "physiotherapy_private", "dental_checkup_private", "dental_filling_private", "cataract_surgery_private", "hip_replacement_private", "knee_replacement_private", "hernia_repair_private"]
    private_insurance: bool = False
    recovery_weeks: int = Field(ge=0, le=260)
    time_off_work_weeks: int = Field(ge=0, le=260)
    weekly_income_gbp: float = Field(ge=0)
    referral_needed: bool = False


class HealthcareCostResult(BaseModel):
    procedure: str; procedure_cost_private: float; lost_income_during_recovery: float; estimated_prescription_costs_nhs: float
    total_private_cost: float; total_nhs_cost: float; potential_savings_with_nhs: float; recovery_time_weeks: int; private_insurance_premium_monthly: float


class BMIRequest(BaseModel):
    """Example: ``{"weight_kg": 70, "height_cm": 175, "age": 30, "gender": "male"}``."""
    weight_kg: PositiveFloat; height_cm: PositiveFloat = Field(le=300); age: int = Field(ge=2, le=120); gender: Literal["male", "female", "other"]


class BMIResult(BaseModel):
    bmi: float; category: str


class BMRTDEERequest(BMIRequest):
    """Example: ``{"weight_kg": 70, "height_cm": 175, "age": 30, "gender": "male", "activity_level": "moderate"}``."""
    gender: Literal["male", "female"]
    activity_level: Literal["sedentary", "light", "moderate", "active", "very_active"]


class BMRTDEEResult(BaseModel):
    bmr: float; tdee: float; formula: str


class BodyFatRequest(BMIRequest):
    """Example: ``{"weight_kg": 70, "height_cm": 175, "age": 30, "gender": "male", "neck_cm": 38, "waist_cm": 84}``."""
    neck_cm: PositiveFloat; waist_cm: PositiveFloat; hip_cm: float = Field(default=0, ge=0)

    @model_validator(mode="after")
    def hips_required_for_female(self) -> "BodyFatRequest":
        if self.gender == "female" and self.hip_cm <= 0:
            raise ValueError("hip_cm must be greater than zero for female body-fat calculation")
        if self.gender == "other":
            raise ValueError("U.S. Navy body-fat calculation requires male or female gender")
        return self


class BodyFatResult(BaseModel):
    body_fat_percentage: float; fat_mass_kg: float; lean_mass_kg: float; method: str


class LoanRequest(BaseModel):
    """Example: ``{"principal_usd": 10000, "annual_rate_percent": 5, "term_months": 36}``."""
    principal_usd: PositiveFloat; annual_rate_percent: float = Field(ge=0, le=100); term_months: int = Field(ge=1, le=1200)


class LoanResult(BaseModel):
    monthly_payment: float; total_interest: float; total_paid: float


class CurrencyConverterRequest(BaseModel):
    """Example: ``{"amount": 100, "from_currency": "GBP", "to_currency": "USD"}``."""
    amount: float = Field(ge=0, le=1_000_000_000)
    from_currency: Literal["GBP", "USD", "EUR", "CAD", "AUD", "JPY", "CHF"]
    to_currency: Literal["GBP", "USD", "EUR", "CAD", "AUD", "JPY", "CHF"]


class CurrencyConverterResult(BaseModel):
    converted_amount: float; exchange_rate: float; timestamp: str; rate_source: str


class IR35Request(BaseModel):
    """Compare simplified 2025/26 inside and outside IR35 contractor outcomes.

    Example: ``{"daily_rate_gbp": 500, "contract_duration_months": 12,
    "days_worked_per_year": 220, "car_miles_per_year": 5000}``.
    """
    daily_rate_gbp: PositiveFloat = Field(le=100_000)
    contract_duration_months: Literal[3, 6, 12] = 12
    days_worked_per_year: int = Field(default=220, ge=1, le=366)
    car_miles_per_year: float = Field(default=0, ge=0, le=1_000_000)
    accountant_fees_per_year_gbp: float = Field(default=800, ge=0, le=1_000_000)
    software_equipment_costs_per_year_gbp: float = Field(default=1_200, ge=0, le=1_000_000)


class IR35InsideResult(BaseModel):
    annual_gross_income: float; employer_national_insurance: float; pension_contribution: float
    accountant_fees: float; software_equipment_costs: float; taxable_income: float; income_tax: float
    employee_national_insurance: float; mileage_benefit: float; annual_net_take_home: float
    monthly_net_take_home: float; contract_net_take_home: float; cost_to_company: float


class IR35OutsideResult(BaseModel):
    annual_gross_revenue: float; accountant_fees: float; software_equipment_costs: float
    mileage_business_expense: float; taxable_profit: float; corporation_tax_rate_pct: float
    corporation_tax: float; profit_after_corporation_tax: float; salary: float; dividends_before_tax: float
    dividend_allowance: float; dividend_tax: float; mileage_benefit: float; annual_net_take_home: float
    monthly_net_take_home: float; contract_net_take_home: float; cost_to_company: float


class IR35Result(BaseModel):
    daily_rate: float; days_worked_per_year: int; contract_duration_months: int
    inside_ir35: IR35InsideResult; outside_ir35: IR35OutsideResult; annual_difference_outside_minus_inside: float
    monthly_difference_outside_minus_inside: float; difference_percent: float; recommended_structure: str
    assumptions: list[str]
