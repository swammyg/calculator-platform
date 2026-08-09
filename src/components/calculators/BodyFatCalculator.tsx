import { CalculatorWidget } from "./CalculatorWidget"; import { calculators } from "../../pages/calculators";
export function BodyFatCalculator(): JSX.Element { return <CalculatorWidget definition={calculators[8]} />; }
