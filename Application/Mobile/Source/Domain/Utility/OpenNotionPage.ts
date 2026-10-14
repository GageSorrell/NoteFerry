import { Linking } from "react-native";
import * as WebBrowser from "expo-web-browser";

const DashlessPageId = (PageId: string): string => PageId.replaceAll("-", "");

export const OpenNotionPage = async (
    PageId: string,
    PageUrl?: string
): Promise<void> =>
{
    const WebUrl = PageUrl
        ?? `https://www.notion.so/${ DashlessPageId(PageId) }`;
    const Parsed = new URL(WebUrl);
    const NotionUrl = `notion://${ Parsed.host }${ Parsed.pathname }${ Parsed.search }`;

    try
    {
        if (await Linking.canOpenURL(NotionUrl))
        {
            await Linking.openURL(NotionUrl);
            return;
        }
    }
    catch
    {
        /* Fall through to the web page when Notion is not installed or the
         * platform disallows querying the custom scheme. */
    }

    await WebBrowser.openBrowserAsync(WebUrl);
};
