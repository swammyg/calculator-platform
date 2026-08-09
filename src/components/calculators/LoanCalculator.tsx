import { CalculatorWidget } from "./CalculatorWidget"; import { calculators } from "../../pages/calculators";
export function LoanCalculator(): JSX.Element { return <CalculatorWidget definition={calculators[9]} />; }
