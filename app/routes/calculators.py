"""Routes for the eleven calculator products."""
from typing import Any, Callable, TypeVar

from fastapi import APIRouter, Request
from pydantic import BaseModel

from app.models import calculators as m
from app.routes.common import cached_response
from app.services import calculator_service as service

router = APIRouter(prefix="/api/v1/calculators", tags=["calculators"])
RequestModel = TypeVar("RequestModel", bound=BaseModel)


def _register(path: str, request_model: type[RequestModel], calculator: Callable[[RequestModel], BaseModel], summary: str) -> None:
    """Register a typed calculator endpoint with one-hour shared caching."""
    async def endpoint(data: request_model, request: Request) -> dict[str, Any]:  # type: ignore[valid-type]
        return await cached_response(request, f"calculators:{path}", data, lambda: calculator(data).model_dump())
    endpoint.__name__ = path.strip("/").replace("-", "_")
    endpoint.__doc__ = summary
    router.post(path, summary=summary)(endpoint)


_register("/uk-salary-tax", m.SalaryTaxRequest, service.salary_tax, "UK salary tax estimate (2024/25 bands)")
_register("/uk-mortgage", m.MortgageRequest, service.mortgage, "UK repayment mortgage and SDLT estimate")
_register("/uk-pension", m.PensionRequest, service.pension, "UK pension projection")
_register("/uk-personal-finance", m.PersonalFinanceRequest, service.personal_finance, "UK personal finance and savings plan")
_register("/b2b-roi", m.B2BROIRequest, service.b2b_roi, "B2B investment ROI and NPV")
_register("/uk-healthcare-cost", m.HealthcareCostRequest, service.healthcare_cost, "Indicative UK private versus NHS healthcare costs")
_register("/bmi", m.BMIRequest, service.bmi, "Body mass index")
_register("/bmr-tdee", m.BMRTDEERequest, service.bmr_tdee, "Basal metabolic rate and daily energy estimate")
_register("/body-fat", m.BodyFatRequest, service.body_fat, "U.S. Navy body-fat estimate")
_register("/loan", m.LoanRequest, service.loan, "Fixed-rate loan repayment")
_register("/currency-converter", m.CurrencyConverterRequest, service.currency_converter, "Indicative currency conversion")
