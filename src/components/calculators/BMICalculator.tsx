import { CalculatorWidget } from "./CalculatorWidget"; import { calculators } from "../../pages/calculators";
export function BMICalculator(): JSX.Element { return <CalculatorWidget definition={calculators[6]} />; }
