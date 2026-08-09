import { CalculatorWidget } from "./CalculatorWidget"; import { calculators } from "../../pages/calculators";
export function BMRTDEECalculator(): JSX.Element { return <CalculatorWidget definition={calculators[7]} />; }
