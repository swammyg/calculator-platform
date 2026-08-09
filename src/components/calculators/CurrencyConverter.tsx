import { CalculatorWidget } from "./CalculatorWidget"; import { calculators } from "../../pages/calculators";
export function CurrencyConverter(): JSX.Element { return <CalculatorWidget definition={calculators[10]} />; }
