import { WordCounterTool } from "../../components/seo-tools/WordCounterTool"; import { SeoToolPage } from "./SeoToolPage";
export function WordCounterPage(): JSX.Element { return <SeoToolPage title="Word Counter" description="Live word statistics, frequency, and exportable content data."><WordCounterTool /></SeoToolPage>; }
