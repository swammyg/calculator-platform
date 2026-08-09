import { CalculatorWidget } from "./CalculatorWidget"; import { calculators } from "../../pages/calculators";
export function UKPersonalFinanceCalculator(): JSX.Element { return <CalculatorWidget definition={calculators[3]} />; }
