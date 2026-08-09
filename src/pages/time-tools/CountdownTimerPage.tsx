import { CountdownTimerTool } from "../../components/time-tools/CountdownTimerTool"; import { TimeToolPage } from "./TimeToolPage";
export function CountdownTimerPage(): JSX.Element { return <TimeToolPage title="Countdown Timer" description="A saved, second-by-second countdown for your next important event."><CountdownTimerTool /></TimeToolPage>; }
