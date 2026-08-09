import { AgeCalculatorTool } from "../../components/time-tools/AgeCalculatorTool"; import { TimeToolPage } from "./TimeToolPage";
export function AgeCalculatorPage(): JSX.Element { return <TimeToolPage title="Age Calculator" description="See your calendar age, zodiac sign, and next birthday at a glance."><AgeCalculatorTool /></TimeToolPage>; }
