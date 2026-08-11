"""Deterministic implementations for calculator endpoints.

UK tax and SDLT figures follow the simplified 2024/25 bands supplied in the
product brief. They are estimates, not tax, investment, or medical advice.
"""
from datetime import datetime, timezone
from math import log10, pow
from typing import Any

from app.models import calculators as m

PROCEDURE_COSTS: dict[str, float] = {"gp_consultation_private": 100, "dermatology_private": 150, "physiotherapy_private": 60, "dental_checkup_private": 50, "dental_filling_private": 200, "cataract_surgery_private": 3500, "hip_replacement_private": 12000, "knee_replacement_private": 11000, "hernia_repair_private": 5000}
GBP_PER_UNIT: dict[str, float] = {"GBP": 1.0, "USD": 0.79, "EUR": 0.86, "CAD": 0.58, "AUD": 0.52, "JPY": 0.0051, "CHF": 0.90}


def _money(value: float) -> float:
    """Round monetary output to two decimal places, avoiding binary artefacts."""
    return round(value + 1e-12, 2)


def _progressive_tax(income: float, bands: list[tuple[float, float]]) -> float:
    """Apply marginal tax bands expressed as upper thresholds and rates."""
    tax, lower = 0.0, 0.0
    for upper, rate in bands:
        taxable = max(0.0, min(income, upper) - lower)
        tax += taxable * rate
        lower = upper
    return tax


def salary_tax(data: m.SalaryTaxRequest) -> m.SalaryTaxResult:
    """Estimate UK employee/employer deductions for the 2024/25 tax year."""
    gross = data.annual_salary_gbp + data.bonus_gbp
    pension = gross * data.pension_contribution_pct / 100
    adjusted_income = max(0.0, gross - pension)
    allowance = max(0.0, 12_570 - max(0.0, adjusted_income - 100_000) / 2)
    taxable = max(0.0, adjusted_income - allowance)
    bands = [(2_430, .19), (31_092, .20), (62_430, .40), (float("inf"), .45)] if data.is_scotland else [(37_700, .20), (112_570, .40), (float("inf"), .45)]
    income_tax = _progressive_tax(taxable, bands)
    employee_ni = min(adjusted_income, 50_270) * .08 + max(0.0, adjusted_income - 50_270) * .02
    employer_ni = max(0.0, adjusted_income - 9_100) * .138
    student_loan = max(0.0, adjusted_income - 27_295) * .09 if data.student_loan else 0.0
    deductions = pension + income_tax + employee_ni + student_loan
    take_home = gross - deductions
    return m.SalaryTaxResult(annual_gross_salary=_money(gross), income_tax=_money(income_tax), employee_national_insurance=_money(employee_ni), employer_national_insurance=_money(employer_ni), student_loan_repayment=_money(student_loan), total_deductions=_money(deductions), annual_take_home=_money(take_home), monthly_take_home=_money(take_home / 12), effective_tax_rate_pct=round(deductions / gross * 100, 2) if gross else 0.0)


def mortgage(data: m.MortgageRequest) -> m.MortgageResult:
    """Calculate repayment mortgage, ongoing housing costs, and basic SDLT."""
    loan = data.property_price_gbp - data.deposit_gbp
    months, rate = data.term_years * 12, data.interest_rate_percent / 1200
    payment = loan / months if rate == 0 else loan * rate / (1 - pow(1 + rate, -months))
    sdlt = max(0.0, min(data.property_price_gbp, 925_000) - 250_000) * .05 + max(0.0, data.property_price_gbp - 925_000) * .10
    council, insurance = data.property_tax_annual_gbp / 12, data.insurance_annual_gbp / 12
    maintenance = data.property_price_gbp * data.maintenance_reserve_pct / 1200
    total_payment = payment + council + insurance + maintenance
    interest = payment * months - loan
    return m.MortgageResult(property_price=_money(data.property_price_gbp), deposit=_money(data.deposit_gbp), loan_amount=_money(loan), stamp_duty_land_tax=_money(sdlt), monthly_mortgage_payment=_money(payment), monthly_council_tax=_money(council), monthly_insurance=_money(insurance), monthly_maintenance_reserve=_money(maintenance), total_monthly_payment=_money(total_payment), total_interest_over_term=_money(interest), total_cost=_money(loan + interest + sdlt))


def pension(data: m.PensionRequest) -> m.PensionResult:
    """Project a pension pot using annual end-of-year contributions."""
    years = data.retirement_age - data.current_age
    annual_contribution = data.annual_contribution_gbp + data.current_salary_gbp * data.employer_contribution_pct / 100
    rate = data.annual_growth_rate_pct / 100
    future_pot = data.current_pension_pot_gbp * pow(1 + rate, years)
    contributions_value = annual_contribution * years if rate == 0 else annual_contribution * ((pow(1 + rate, years) - 1) / rate)
    pot = future_pot + contributions_value
    withdrawal = pot * .04
    state = 11_000 / 12
    return m.PensionResult(current_pension_pot=_money(data.current_pension_pot_gbp), years_to_retirement=years, annual_contribution=_money(annual_contribution), projected_pension_pot_at_retirement=_money(pot), tax_free_lump_sum_25pct=_money(pot * .25), taxable_pension_pot=_money(pot * .75), annual_withdrawal_4pct=_money(withdrawal), monthly_pension_income=_money(withdrawal / 12), state_pension_monthly_estimate=_money(state), total_monthly_retirement_income=_money(withdrawal / 12 + state), years_in_retirement=data.life_expectancy - data.retirement_age)


def personal_finance(data: m.PersonalFinanceRequest) -> m.PersonalFinanceResult:
    """Calculate available savings and a 50/30/20 budget benchmark."""
    expenses = data.essential_expenses_gbp + data.discretionary_spending_gbp
    remaining = data.monthly_income_gbp - expenses
    annual = max(0.0, remaining) * 12
    years = 0.0 if data.savings_goal_gbp == 0 else (data.savings_goal_gbp / annual if annual else None)
    return m.PersonalFinanceResult(monthly_income=_money(data.monthly_income_gbp), monthly_expenses=_money(expenses), monthly_remaining=_money(remaining), annual_savings_potential=_money(annual), years_to_reach_goal=round(years, 2) if years is not None else None, breakdown={"needs_recommended": _money(data.monthly_income_gbp * .5), "wants_recommended": _money(data.monthly_income_gbp * .3), "savings_recommended": _money(data.monthly_income_gbp * .2)})


def b2b_roi(data: m.B2BROIRequest) -> m.B2BROIResult:
    """Calculate undiscounted ROI and five-year discounted net present value."""
    benefit = data.annual_revenue_increase_gbp + data.cost_savings_annual_gbp - data.maintenance_cost_annual_gbp
    months = data.project_investment_gbp / benefit * 12 if benefit > 0 else None
    rate = data.discount_rate_pct / 100
    npv = -data.project_investment_gbp + sum(benefit / pow(1 + rate, year) for year in range(1, 6))
    roi = (benefit - data.project_investment_gbp) / data.project_investment_gbp * 100
    annual_roi = benefit / data.project_investment_gbp * 100
    return m.B2BROIResult(project_investment=_money(data.project_investment_gbp), annual_benefit=_money(benefit), payback_period_months=data.payback_period_months, payback_period_years=round(data.payback_period_months / 12, 2), months_to_breakeven=round(months, 2) if months is not None else None, roi_percentage=round(roi, 2), net_present_value_5yr=_money(npv), cumulative_benefit_3yr=_money(benefit * 3), cumulative_benefit_5yr=_money(benefit * 5), annual_roi_percentage=round(annual_roi, 2))


def healthcare_cost(data: m.HealthcareCostRequest) -> m.HealthcareCostResult:
    """Compare indicative private cost against NHS prescription and lost-income costs."""
    procedure = PROCEDURE_COSTS[data.procedure_type]
    lost_income = data.time_off_work_weeks * data.weekly_income_gbp
    prescriptions = 9.90 * (1 + int(data.referral_needed))
    private_total = procedure + lost_income
    nhs_total = prescriptions + lost_income
    premium = 70.0 if data.private_insurance else 0.0
    return m.HealthcareCostResult(procedure=data.procedure_type, procedure_cost_private=_money(procedure), lost_income_during_recovery=_money(lost_income), estimated_prescription_costs_nhs=_money(prescriptions), total_private_cost=_money(private_total), total_nhs_cost=_money(nhs_total), potential_savings_with_nhs=_money(private_total - nhs_total), recovery_time_weeks=data.recovery_weeks, private_insurance_premium_monthly=premium)


def bmi(data: m.BMIRequest) -> m.BMIResult:
    """Return adult BMI categories; age and gender are retained for client context."""
    score = data.weight_kg / pow(data.height_cm / 100, 2)
    category = "Underweight" if score < 18.5 else "Normal" if score < 25 else "Overweight" if score < 30 else "Obese"
    return m.BMIResult(bmi=round(score, 1), category=category)


def bmr_tdee(data: m.BMRTDEERequest) -> m.BMRTDEEResult:
    """Use Mifflin–St Jeor and activity multipliers to estimate daily energy."""
    sex_adjustment = 5 if data.gender == "male" else -161
    bmr = 10 * data.weight_kg + 6.25 * data.height_cm - 5 * data.age + sex_adjustment
    multipliers = {"sedentary": 1.2, "light": 1.375, "moderate": 1.55, "active": 1.725, "very_active": 1.9}
    return m.BMRTDEEResult(bmr=round(bmr), tdee=round(bmr * multipliers[data.activity_level]), formula="Mifflin-St Jeor")


def body_fat(data: m.BodyFatRequest) -> m.BodyFatResult:
    """Apply the U.S. Navy circumference method (measurements in centimetres)."""
    if data.waist_cm <= data.neck_cm:
        raise ValueError("waist_cm must be greater than neck_cm for the U.S. Navy method")
    height = data.height_cm
    if data.gender == "male":
        percentage = 495 / (1.0324 - .19077 * log10(data.waist_cm - data.neck_cm) + .15456 * log10(height)) - 450
    else:
        if data.waist_cm + data.hip_cm <= data.neck_cm:
            raise ValueError("waist_cm plus hip_cm must be greater than neck_cm")
        percentage = 495 / (1.29579 - .35004 * log10(data.waist_cm + data.hip_cm - data.neck_cm) + .22100 * log10(height)) - 450
    percentage = max(0.0, percentage)
    fat_mass = data.weight_kg * percentage / 100
    return m.BodyFatResult(body_fat_percentage=round(percentage, 1), fat_mass_kg=round(fat_mass, 1), lean_mass_kg=round(data.weight_kg - fat_mass, 1), method="U.S. Navy circumference")


def loan(data: m.LoanRequest) -> m.LoanResult:
    """Calculate a fixed-rate amortising loan payment in USD."""
    rate = data.annual_rate_percent / 1200
    payment = data.principal_usd / data.term_months if rate == 0 else data.principal_usd * rate / (1 - pow(1 + rate, -data.term_months))
    total = payment * data.term_months
    return m.LoanResult(monthly_payment=_money(payment), total_interest=_money(total - data.principal_usd), total_paid=_money(total))


def currency_converter(data: m.CurrencyConverterRequest) -> m.CurrencyConverterResult:
    """Convert via bundled indicative GBP cross-rates; no external FX request occurs."""
    rate = GBP_PER_UNIT[data.from_currency] / GBP_PER_UNIT[data.to_currency]
    return m.CurrencyConverterResult(converted_amount=round(data.amount * rate, 4), exchange_rate=round(rate, 6), timestamp=datetime.now(timezone.utc).isoformat(), rate_source="Indicative bundled rates")


def ir35(data: m.IR35Request) -> m.IR35Result:
    """Compare simplified annual inside-IR35 payroll and outside-IR35 company outcomes.

    This deliberately uses the rates and simplified assumptions from the product
    brief. It is an illustration only: real IR35 engagements can involve fee
    payer deductions, employment allowance, expenses rules, and dividend bands
    that require professional advice.
    """
    gross = data.daily_rate_gbp * data.days_worked_per_year
    mileage = data.car_miles_per_year * 0.45
    accountant = data.accountant_fees_per_year_gbp
    software = data.software_equipment_costs_per_year_gbp

    employer_ni = gross * 0.15
    pension = gross * 0.08
    inside_taxable = max(0.0, gross - employer_ni - pension - accountant - software)
    income_tax = _progressive_tax(max(0.0, inside_taxable - 12_570), [(37_700, 0.20), (float("inf"), 0.40)])
    employee_ni = max(0.0, min(inside_taxable, 50_270) - 12_570) * 0.08 + max(0.0, inside_taxable - 50_270) * 0.02
    inside_net = gross - employer_ni - pension - accountant - software - income_tax - employee_ni + mileage

    outside_profit = max(0.0, gross - accountant - software - mileage)
    corporation_rate = 0.19 if outside_profit <= 250_000 else 0.25
    corporation_tax = outside_profit * corporation_rate
    post_corporation_tax = outside_profit - corporation_tax
    salary = min(12_570.0, post_corporation_tax)
    dividends = max(0.0, post_corporation_tax - salary)
    dividend_allowance = min(500.0, dividends)
    dividend_tax = max(0.0, dividends - dividend_allowance) * 0.0875
    outside_net = salary + dividends - dividend_tax + mileage

    contract_fraction = data.contract_duration_months / 12
    difference = outside_net - inside_net
    inside = m.IR35InsideResult(annual_gross_income=_money(gross), employer_national_insurance=_money(employer_ni), pension_contribution=_money(pension), accountant_fees=_money(accountant), software_equipment_costs=_money(software), taxable_income=_money(inside_taxable), income_tax=_money(income_tax), employee_national_insurance=_money(employee_ni), mileage_benefit=_money(mileage), annual_net_take_home=_money(inside_net), monthly_net_take_home=_money(inside_net / 12), contract_net_take_home=_money(inside_net * contract_fraction), cost_to_company=_money(gross))
    outside = m.IR35OutsideResult(annual_gross_revenue=_money(gross), accountant_fees=_money(accountant), software_equipment_costs=_money(software), mileage_business_expense=_money(mileage), taxable_profit=_money(outside_profit), corporation_tax_rate_pct=corporation_rate * 100, corporation_tax=_money(corporation_tax), profit_after_corporation_tax=_money(post_corporation_tax), salary=_money(salary), dividends_before_tax=_money(dividends), dividend_allowance=_money(dividend_allowance), dividend_tax=_money(dividend_tax), mileage_benefit=_money(mileage), annual_net_take_home=_money(outside_net), monthly_net_take_home=_money(outside_net / 12), contract_net_take_home=_money(outside_net * contract_fraction), cost_to_company=_money(gross))
    recommendation = "Outside IR35 (limited company)" if difference > 0 else "Inside IR35 (employee-like)" if difference < 0 else "Both structures produce the same estimate"
    return m.IR35Result(daily_rate=_money(data.daily_rate_gbp), days_worked_per_year=data.days_worked_per_year, contract_duration_months=data.contract_duration_months, inside_ir35=inside, outside_ir35=outside, annual_difference_outside_minus_inside=_money(difference), monthly_difference_outside_minus_inside=_money(difference / 12), difference_percent=round(difference / inside_net * 100, 2) if inside_net else 0.0, recommended_structure=recommendation, assumptions=["Uses the addendum's simplified 2025/26 UK tax and NI rates.", "No student-loan repayment, VAT, pension relief, personal allowance taper, or higher-rate dividend tax is modelled.", "Mileage uses 45p per mile and is shown as a tax-free reimbursement benefit.", "Corporation tax is 19% up to £250,000 profit and 25% above that threshold; marginal relief is not modelled."])
