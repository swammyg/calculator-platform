import { CalculatorWidget } from "./CalculatorWidget"; import { calculators } from "../../pages/calculators";
export function UKPensionCalculator(): JSX.Element { return <CalculatorWidget definition={calculators[2]} />; }
