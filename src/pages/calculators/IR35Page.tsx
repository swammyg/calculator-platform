import { IR35Calculator } from "../../components/calculators/IR35Calculator";
import { CalculatorFeaturePage } from "./CalculatorFeaturePage";

export function IR35Page(): JSX.Element { return <CalculatorFeaturePage title="IR35 Inside vs Outside Calculator" description="Compare simplified inside-IR35 payroll and outside-IR35 limited-company take-home estimates for UK contractors." disclaimer="This simplified illustration is not tax, legal, or employment-status advice. IR35 determinations and tax treatment depend on your engagement; consult a qualified accountant."><IR35Calculator /></CalculatorFeaturePage>; }
