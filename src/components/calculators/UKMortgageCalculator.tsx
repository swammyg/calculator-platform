import { CalculatorWidget } from "./CalculatorWidget"; import { calculators } from "../../pages/calculators";
export function UKMortgageCalculator(): JSX.Element { return <CalculatorWidget definition={calculators[1]} />; }
