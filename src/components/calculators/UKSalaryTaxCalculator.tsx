import { CalculatorWidget } from "./CalculatorWidget"; import { calculators } from "../../pages/calculators";
export function UKSalaryTaxCalculator(): JSX.Element { return <CalculatorWidget definition={calculators[0]} />; }
